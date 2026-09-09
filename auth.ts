import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { uniqueUsername } from "@/lib/username";

/**
 * Adapter Prisma standar + override createUser supaya setiap user baru
 * langsung punya `username` unik (dibutuhkan schema, tidak diisi Auth.js).
 */
function ForumAdapter(): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async createUser(user) {
      // Hormati toggle "registrasi ditutup" dari site settings.
      const cfg = await prisma.siteConfig
        .findUnique({ where: { id: "singleton" } })
        .catch(() => null);
      if (cfg && !cfg.registrationOpen) {
        throw new Error("Pendaftaran sedang ditutup.");
      }

      const seed =
        (user as { username?: string }).username ||
        user.name ||
        user.email?.split("@")[0] ||
        "user";
      const username = await uniqueUsername(seed, async (c) => {
        const found = await prisma.user.findUnique({ where: { username: c } });
        return !!found;
      });

      const created = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ?? null,
          image: user.image,
          username,
          discordId: (user as { discordId?: string }).discordId ?? null,
        },
      });
      return created as AdapterUser;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: ForumAdapter(),
  trustHost: true,
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [
    Discord({
      authorization:
        "https://discord.com/api/oauth2/authorize?scope=identify+email+guilds+guilds.members.read",
      profile(profile) {
        const image = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${
              profile.avatar.startsWith("a_") ? "gif" : "png"
            }?size=256`
          : `https://cdn.discordapp.com/embed/avatars/${
              (Number(BigInt(profile.id) >> 22n) % 6)
            }.png`;
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image,
          username: profile.username,
          discordId: profile.id,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        const { syncGuildRoles } = await import("@/lib/discord-guild");
        await syncGuildRoles(user.id);
      } catch {
        /* best-effort */
      }
    },
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "discord" || !account.access_token) return true;
      try {
        const { getSiteConfig } = await import("@/lib/site-config");
        const cfg = await getSiteConfig();
        if (!cfg.requireGuild || !cfg.discordGuildId) return true;
        const res = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        if (!res.ok) return true; // jangan kunci user kalau Discord error
        const guilds = (await res.json()) as { id: string }[];
        if (guilds.some((g) => g.id === cfg.discordGuildId)) return true;
        return "/login?error=guild";
      } catch {
        return true;
      }
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          username: true,
          name: true,
          role: true,
          points: true,
          tier: true,
          bannedAt: true,
          mutedUntil: true,
          onboardedAt: true,
          streakCount: true,
          streakLastAt: true,
        },
      });
      session.user.id = user.id;
      session.user.username = dbUser?.username ?? "";
      session.user.role = dbUser?.role ?? "USER";
      session.user.points = dbUser?.points ?? 0;
      session.user.tier = dbUser?.tier ?? "Bronze";
      session.user.banned = !!dbUser?.bannedAt;
      session.user.mutedUntil = dbUser?.mutedUntil?.toISOString() ?? null;
      session.user.onboarded = !!dbUser?.onboardedAt;
      session.user.streak = dbUser?.streakCount ?? 0;

      // Streak login harian
      if (dbUser) {
        const today = new Date().toISOString().slice(0, 10);
        const last = dbUser.streakLastAt?.toISOString().slice(0, 10);
        if (last !== today) {
          const yest = new Date(Date.now() - 86400000)
            .toISOString()
            .slice(0, 10);
          const nextCount = last === yest ? dbUser.streakCount + 1 : 1;
          session.user.streak = nextCount;
          void prisma.user
            .update({
              where: { id: user.id },
              data: {
                streakCount: nextCount,
                streakLastAt: new Date(),
                points: { increment: Math.min(5, nextCount) },
              },
            })
            .catch(() => {});
        }
      }

      // presence: catat aktivitas terakhir (best-effort, tidak menghambat respons)
      if (Math.random() < 0.35) {
        void prisma.user
          .updateMany({
            where: {
              id: user.id,
              OR: [
                { lastSeenAt: null },
                { lastSeenAt: { lt: new Date(Date.now() - 5 * 60_000) } },
              ],
            },
            data: { lastSeenAt: new Date() },
          })
          .catch(() => {});
      }

      return session;
    },
  },
});
