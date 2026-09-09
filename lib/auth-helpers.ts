import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

export const RANK: Record<Role, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

/** Untuk server component: redirect ke /login kalau belum masuk. */
export async function requireUser(callbackUrl = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (user.banned) redirect("/banned");
  return user;
}

export async function requireRole(role: Role, callbackUrl = "/") {
  const user = await requireUser(callbackUrl);
  if (RANK[user.role] < RANK[role]) redirect("/");
  return user;
}

export function hasRole(
  user: { role: Role } | null | undefined,
  role: Role,
): boolean {
  if (!user) return false;
  return RANK[user.role] >= RANK[role];
}

/** true kalau user sedang di-mute (timeout) dan belum kedaluwarsa. */
export function isMuted(user: { mutedUntil?: string | Date | null } | null) {
  if (!user?.mutedUntil) return false;
  return new Date(user.mutedUntil) > new Date();
}

/** Untuk route handler: lempar Response 401/403 alih-alih redirect. */
export async function apiUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  if (user.banned) throw new Response("Banned", { status: 403 });
  return user;
}

/** Wajib login + tidak sedang di-mute (untuk aksi menulis). */
export async function apiWriter() {
  const user = await apiUser();
  if (isMuted(user)) {
    throw new Response(
      JSON.stringify({ error: "Kamu sedang di-timeout, tidak bisa memposting." }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  }
  return user;
}

export async function apiRole(role: Role) {
  const user = await apiUser();
  if (RANK[user.role] < RANK[role])
    throw new Response("Forbidden", { status: 403 });
  return user;
}
