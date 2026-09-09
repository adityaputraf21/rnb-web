import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type SiteConfig = {
  id: string;
  siteName: string;
  tagline: string;
  bannerText: string | null;
  bannerVariant: string;
  registrationOpen: boolean;
  maintenanceMode: boolean;
};

const DEFAULTS: SiteConfig = {
  id: "singleton",
  siteName: "RnB",
  tagline: "Rise Never Break",
  bannerText: null,
  bannerVariant: "info",
  registrationOpen: true,
  maintenanceMode: false,
};

/**
 * Ambil konfigurasi situs. `cache()` = dedupe dalam satu render request
 * (header + banner cukup 1 query).
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const cfg = await prisma.siteConfig.findUnique({
      where: { id: "singleton" },
    });
    if (cfg) return cfg;
    return await prisma.siteConfig.create({ data: { id: "singleton" } });
  } catch {
    return DEFAULTS;
  }
});
