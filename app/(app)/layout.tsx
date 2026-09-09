import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";

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
  if (!user) {
    const h = await headers();
    const path = h.get("x-pathname") || "/feed";
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }
  if (user.banned) redirect("/banned");
  return <>{children}</>;
}
