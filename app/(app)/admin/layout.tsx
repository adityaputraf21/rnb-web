import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireRole("MODERATOR", "/admin");
  const [openReports, openAppeals] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }).catch(() => 0),
    prisma.appeal.count({ where: { status: "OPEN" } }).catch(() => 0),
  ]);

  const tabs = [
    { href: "/admin", label: "Ringkasan" },
    { href: "/admin/reports", label: `Laporan${openReports ? ` (${openReports})` : ""}` },
    { href: "/admin/appeals", label: `Banding${openAppeals ? ` (${openAppeals})` : ""}` },
    { href: "/admin/categories", label: "Kategori" },
    { href: "/admin/users", label: "Pengguna" },
    { href: "/admin/audit", label: "Audit log" },
    ...(me.role === "OWNER"
      ? [{ href: "/admin/site", label: "Setelan Situs" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Panel Moderasi</h1>
        <Badge variant="secondary">{me.role}</Badge>
      </div>
      <nav className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((t) => (
          <Button key={t.href} variant="ghost" size="sm" asChild>
            <Link href={t.href}>{t.label}</Link>
          </Button>
        ))}
      </nav>
      {children}
    </div>
  );
}
