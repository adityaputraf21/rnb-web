import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config";
import type { Role } from "@prisma/client";

const RANK: Record<Role, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

/** Ambil access token Discord user (refresh kalau perlu). */
export async function discordAccessToken(
  userId: string,
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
  });
  if (!account) return null;

  const stillValid =
    account.access_token &&
    (!account.expires_at || account.expires_at * 1000 > Date.now() + 60_000);
  if (stillValid) return account.access_token!;

  if (!account.refresh_token) return account.access_token ?? null;

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: process.env.AUTH_DISCORD_ID ?? "",
      client_secret: process.env.AUTH_DISCORD_SECRET ?? "",
    }),
  });
  if (!res.ok) return account.access_token ?? null;

  const tok = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? account.refresh_token,
      expires_at: tok.expires_in
        ? Math.floor(Date.now() / 1000) + tok.expires_in
        : account.expires_at,
    },
  });
  return tok.access_token;
}

export async function fetchUserGuildIds(token: string): Promise<string[]> {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const guilds = (await res.json()) as { id: string }[];
  return guilds.map((g) => g.id);
}

export async function fetchGuildMemberRoles(
  token: string,
  guildId: string,
): Promise<string[] | null> {
  const res = await fetch(
    `https://discord.com/api/users/@me/guilds/${guildId}/member`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const member = (await res.json()) as { roles?: string[] };
  return member.roles ?? [];
}

/** True kalau user termasuk anggota guild yang diwajibkan (atau tidak diwajibkan). */
export async function isInRequiredGuild(userId: string): Promise<boolean> {
  const cfg = await getSiteConfig();
  if (!cfg.requireGuild || !cfg.discordGuildId) return true;
  const token = await discordAccessToken(userId);
  if (!token) return false;
  const ids = await fetchUserGuildIds(token);
  return ids.includes(cfg.discordGuildId);
}

/**
 * Sinkron role Discord -> role web. Bersifat MENAIKKAN saja (tidak pernah
 * menurunkan role yang sudah diberikan manual), dan tidak menyentuh OWNER.
 */
export async function syncGuildRoles(
  userId: string,
): Promise<{ changed: boolean; role: Role } | null> {
  const cfg = await getSiteConfig();
  if (!cfg.discordGuildId || (!cfg.discordModRoleId && !cfg.discordAdminRoleId))
    return null;

  const token = await discordAccessToken(userId);
  if (!token) return null;
  const roles = await fetchGuildMemberRoles(token, cfg.discordGuildId);
  if (!roles) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role === "OWNER") return null;

  let desired: Role = user.role;
  if (cfg.discordAdminRoleId && roles.includes(cfg.discordAdminRoleId))
    desired = "ADMIN";
  else if (cfg.discordModRoleId && roles.includes(cfg.discordModRoleId))
    desired = "MODERATOR";

  if (RANK[desired] > RANK[user.role]) {
    await prisma.user.update({ where: { id: userId }, data: { role: desired } });
    return { changed: true, role: desired };
  }
  return { changed: false, role: user.role };
}
