import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const kind = new URL(req.url).searchParams.get("kind") ?? undefined;
  const drafts = await prisma.draft.findMany({
    where: { userId: user.id, ...(kind ? { kind } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return NextResponse.json(drafts);
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id, kind, title, body, categoryId, media, scheduledFor } = await req
    .json()
    .catch(() => ({}));

  if (kind !== "status" && kind !== "thread")
    return NextResponse.json({ error: "kind tidak valid" }, { status: 400 });

  const data = {
    kind,
    title: typeof title === "string" ? title.slice(0, 200) || null : null,
    body: typeof body === "string" ? body.slice(0, 8000) : "",
    categoryId: typeof categoryId === "string" ? categoryId : null,
    media: media ?? undefined,
    scheduledFor:
      typeof scheduledFor === "string" && scheduledFor
        ? new Date(scheduledFor)
        : null,
  };

  if (id) {
    const existing = await prisma.draft.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ error: "not found" }, { status: 404 });
    const updated = await prisma.draft.update({ where: { id }, data });
    return NextResponse.json(updated);
  }

  const count = await prisma.draft.count({ where: { userId: user.id } });
  if (count >= 50)
    return NextResponse.json({ error: "maksimal 50 draf" }, { status: 400 });

  const created = await prisma.draft.create({
    data: { ...data, userId: user.id },
  });
  return NextResponse.json(created, { status: 201 });
}
