import { requireRole } from "@/lib/auth-helpers";
import { getSiteConfig } from "@/lib/site-config";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSitePage() {
  await requireRole("OWNER", "/admin/site");
  const cfg = await getSiteConfig();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Hanya Owner yang bisa mengubah ini.
      </p>
      <SiteSettingsForm
        initial={{
          siteName: cfg.siteName,
          tagline: cfg.tagline,
          bannerText: cfg.bannerText,
          bannerVariant: cfg.bannerVariant,
          registrationOpen: cfg.registrationOpen,
          maintenanceMode: cfg.maintenanceMode,
        }}
      />
    </div>
  );
}
