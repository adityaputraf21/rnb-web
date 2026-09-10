import { NextResponse } from "next/server";
import { apiWriter, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { slugBase } from "@/lib/slug";
import { isCategory } from "@/lib/marketplace";
import { blockedIdsFor } from "@/lib/blocks";
import { assertListingRate } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const category = sp.get("category") ?? undefined;
  const q = sp.get("q")?.trim() ?? "";
  const mine = sp.get("mine") === "1";
  const hidden = await blockedIdsFor(me.id);

  const listings = await prisma.listing.findMany({
    where: {
      ...(mine
        ? { sellerId: me.id }
        : {
            status: "active",
            ...(hidden.size ? { sellerId: { notIn: [...hidden] } } : {}),
          }),
      ...(category && isCategory(category) ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      seller: { select: { username: true, name: true } },
    },
  });

  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiWriter();
    await assertListingRate(user.id);
  } catch (res) {
    return res as Response;
  }

  const { title, description, price, negotiable, category, condition, location, images } =
    await req.json().catch(() => ({}));

  const t = typeof title === "string" ? title.trim().slice(0, 120) : "";
  const d = typeof description === "string" ? description.trim().slice(0, 4000) : "";
  if (t.length < 3 || d.length < 10)
    return NextResponse.json(
      { error: "judul & deskripsi terlalu pendek" },
      { status: 400 },
    );

  const priceInt = Math.max(0, Math.min(1_000_000_000, Math.round(Number(price) || 0)));
  const imgs: string[] = Array.isArray(images)
    ? images
        .filter((u: unknown) => typeof u === "string" && /^https:\/\//.test(u))
        .slice(0, 8)
    : [];

  let slug = slugBase(t);
  if (await prisma.listing.findUnique({ where: { slug } }))
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const listing = await prisma.listing.create({
    data: {
      title: t,
      slug,
      description: d,
      price: priceInt,
      negotiable: !!negotiable,
      category: isCategory(category) ? category : "lainnya",
      condition: condition === "new" ? "new" : "used",
      location: typeof location === "string" ? location.trim().slice(0, 80) || null : null,
      sellerId: user.id,
      images: { create: imgs.map((url, i) => ({ url, position: i })) },
    },
  });

  return NextResponse.json({ id: listing.id, slug: listing.slug }, { status: 201 });
}
