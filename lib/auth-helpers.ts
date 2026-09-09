import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

const RANK: Record<Role, number> = { USER: 0, MODERATOR: 1, ADMIN: 2 };

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

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

/** Untuk route handler: lempar Response 401/403 alih-alih redirect. */
export async function apiUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  if (user.banned) throw new Response("Banned", { status: 403 });
  return user;
}

export async function apiRole(role: Role) {
  const user = await apiUser();
  if (RANK[user.role] < RANK[role]) throw new Response("Forbidden", { status: 403 });
  return user;
}
