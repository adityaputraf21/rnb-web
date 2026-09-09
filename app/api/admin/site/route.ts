import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { modLog } from "@/lib/mod-log";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  let owner;
  try {
    owner = await apiRole("OWNER");
  } catch (res) {
    return res as Response;
  }

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof b.siteName === "string" && b.siteName.trim())
    data.siteName = b.siteName.trim().slice(0, 40);
  if (typeof b.tagline === "string") data.tagline = b.tagline.trim().slice(0, 80);
  if (typeof b.bannerText === "string")
    data.bannerText = b.bannerText.trim().slice(0, 200) || null;
  if (["info", "warning", "success"].includes(b.bannerVariant))
    data.bannerVariant = b.bannerVariant;
  if (typeof b.registrationOpen === "boolean")
    data.registrationOpen = b.registrationOpen;
  if (typeof b.maintenanceMode === "boolean")
    data.maintenanceMode = b.maintenanceMode;

  const cfg = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  await modLog({
    moderatorId: owner.id,
    moderatorName: owner.username,
    action: "site.update",
    targetType: "site",
    targetId: "singleton",
    summary: `Setelan situs diubah: ${Object.keys(data).join(", ")}`,
    meta: data,
  });

  return NextResponse.json(cfg);
}
