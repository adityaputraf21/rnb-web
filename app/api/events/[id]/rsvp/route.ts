import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const STATUSES = ["going", "maybe", "no"];

async function counts(eventId: string) {
  const rows = await prisma.eventRSVP.groupBy({
    by: ["status"],
    where: { eventId },
    _count: true,
  });
  const out: Record<string, number> = { going: 0, maybe: 0, no: 0 };
  for (const r of rows) out[r.status] = r._count;
  return out;
}

export async function POST(
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
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { status } = await req.json().catch(() => ({}));

  if (!status || status === "clear") {
    await prisma.eventRSVP
      .delete({ where: { eventId_userId: { eventId: id, userId: user.id } } })
      .catch(() => {});
    return NextResponse.json({ my: null, counts: await counts(id) });
  }
  if (!STATUSES.includes(status))
    return NextResponse.json({ error: "status tidak valid" }, { status: 400 });

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId: id, userId: user.id } },
    create: { eventId: id, userId: user.id, status },
    update: { status },
  });
  return NextResponse.json({ my: status, counts: await counts(id) });
}
