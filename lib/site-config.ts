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

/** Ambil konfigurasi situs (buat baris default kalau belum ada). */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const cfg = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return cfg;
  } catch {
    return DEFAULTS;
  }
}
