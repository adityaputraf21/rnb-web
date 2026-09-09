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
        "https://discord.com/api/oauth2/authorize?scope=identify+email",
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
  callbacks: {
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          username: true,
          role: true,
          points: true,
          tier: true,
          bannedAt: true,
        },
      });
      session.user.id = user.id;
      session.user.username = dbUser?.username ?? "";
      session.user.role = dbUser?.role ?? "USER";
      session.user.points = dbUser?.points ?? 0;
      session.user.tier = dbUser?.tier ?? "Bronze";
      session.user.banned = !!dbUser?.bannedAt;
      return session;
    },
  },
});
