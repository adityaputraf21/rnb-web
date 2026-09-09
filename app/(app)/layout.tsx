import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { applyPendingInvite } from "@/lib/invites";

/**
 * Semua halaman di grup (app) wajib login. Middleware sudah menyaring cepat
 * berdasarkan cookie; ini verifikasi sesungguhnya di server.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const h = await headers();
  const path = h.get("x-pathname") || "/feed";

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }
  if (user.banned) redirect("/banned");

  void applyPendingInvite(user.id).catch(() => {});

  if (!user.onboarded && !path.startsWith("/onboarding")) {
    redirect("/onboarding");
  }
  return <>{children}</>;
}
