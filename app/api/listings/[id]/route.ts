import { NextResponse } from "next/server";
import { apiUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isCategory } from "@/lib/marketplace";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (listing.sellerId !== user.id && !hasRole(user, "MODERATOR"))
    return NextResponse.json({ error: "bukan iklanmu" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim())
    data.title = b.title.trim().slice(0, 120);
  if (typeof b.description === "string" && b.description.trim())
    data.description = b.description.trim().slice(0, 4000);
  if (b.price !== undefined)
    data.price = Math.max(0, Math.round(Number(b.price) || 0));
  if (typeof b.negotiable === "boolean") data.negotiable = b.negotiable;
  if (isCategory(b.category)) data.category = b.category;
  if (b.condition === "new" || b.condition === "used")
    data.condition = b.condition;
  if (typeof b.location === "string")
    data.location = b.location.trim().slice(0, 80) || null;
  if (["active", "sold", "closed"].includes(b.status)) data.status = b.status;

  if (Array.isArray(b.images)) {
    const imgs: string[] = b.images
      .filter((u: unknown) => typeof u === "string" && /^https:\/\//.test(u))
      .slice(0, 8);
    await prisma.listingImage.deleteMany({ where: { listingId: id } });
    await prisma.listingImage.createMany({
      data: imgs.map((url, i) => ({ listingId: id, url, position: i })),
    });
  }

  const updated = await prisma.listing.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (listing.sellerId !== user.id && !hasRole(user, "MODERATOR"))
    return NextResponse.json({ error: "bukan iklanmu" }, { status: 403 });

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
