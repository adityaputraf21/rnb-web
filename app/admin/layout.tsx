import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";

const TABS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("MODERATOR", "/admin");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Panel Moderasi</h1>
      <nav className="flex flex-wrap gap-1 border-b pb-2">
        {TABS.map((t) => (
          <Button key={t.href} variant="ghost" size="sm" asChild>
            <Link href={t.href}>{t.label}</Link>
          </Button>
        ))}
      </nav>
      {children}
    </div>
  );
}
