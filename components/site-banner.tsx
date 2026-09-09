import { Info, TriangleAlert, CircleCheck } from "lucide-react";
import { getSiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const VARIANTS = {
  info: { cls: "bg-primary/10 text-primary border-primary/20", Icon: Info },
  warning: {
    cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
    Icon: TriangleAlert,
  },
  success: {
    cls: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
    Icon: CircleCheck,
  },
};

export async function SiteBanner() {
  const cfg = await getSiteConfig();
  if (!cfg.bannerText && !cfg.maintenanceMode) return null;

  if (cfg.maintenanceMode) {
    return (
      <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-600 dark:text-yellow-400">
        <TriangleAlert className="mr-1 inline h-4 w-4" />
        Situs sedang dalam mode maintenance — beberapa fitur dibatasi.
      </div>
    );
  }

  const v = VARIANTS[cfg.bannerVariant as keyof typeof VARIANTS] ?? VARIANTS.info;
  return (
    <div className={cn("border-b px-4 py-2 text-center text-sm", v.cls)}>
      <v.Icon className="mr-1 inline h-4 w-4" />
      {cfg.bannerText}
    </div>
  );
}
