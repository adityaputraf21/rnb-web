import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function avatarUrl(id: string, hash: string | null) {
  if (!hash)
    return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${hash.startsWith("a_") ? "gif" : "png"}?size=256`;
}

async function fetchMe(token: string) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  }>;
}

/** Tarik ulang nama & avatar dari Discord. */
export async function POST() {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const account = await prisma.account.findFirst({
    where: { userId: me.id, provider: "discord" },
  });
  if (!account?.access_token)
    return NextResponse.json(
      { error: "Sesi Discord tidak tersedia — coba logout lalu login lagi." },
      { status: 400 },
    );

  let profile = await fetchMe(account.access_token);

  // Token kedaluwarsa? Coba refresh.
  if (!profile && account.refresh_token) {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: process.env.AUTH_DISCORD_ID ?? "",
      client_secret: process.env.AUTH_DISCORD_SECRET ?? "",
    });
    const tokRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (tokRes.ok) {
      const tok = (await tokRes.json()) as {
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
      profile = await fetchMe(tok.access_token);
    }
  }

  if (!profile)
    return NextResponse.json(
      { error: "Gagal ambil data Discord — logout lalu login lagi." },
      { status: 400 },
    );

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      name: profile.global_name ?? profile.username,
      image: avatarUrl(profile.id, profile.avatar),
      discordId: profile.id,
    },
    select: { name: true, image: true },
  });
  return NextResponse.json(updated);
}
