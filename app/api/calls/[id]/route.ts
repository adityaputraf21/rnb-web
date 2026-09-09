import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function loadForUser(id: string, userId: string) {
  const call = await prisma.callSession.findUnique({ where: { id } });
  if (!call || (call.callerId !== userId && call.calleeId !== userId))
    return null;
  return call;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const call = await loadForUser(id, me.id);
  if (!call)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const iAmCaller = call.callerId === me.id;
  const since = new URL(req.url).searchParams.get("since");
  const candidates = await prisma.callCandidate.findMany({
    where: {
      callId: id,
      fromCaller: !iAmCaller, // hanya kandidat dari lawan
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({
    id: call.id,
    kind: call.kind,
    status: call.status,
    iAmCaller,
    offer: iAmCaller ? null : call.offer,
    answer: iAmCaller ? call.answer : null,
    candidates: candidates.map((c) => ({
      data: c.data,
      at: c.createdAt.toISOString(),
    })),
    serverNow: new Date().toISOString(),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const call = await loadForUser(id, me.id);
  if (!call)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const iAmCaller = call.callerId === me.id;
  const { offer, answer, status } = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (offer && iAmCaller) data.offer = offer;
  if (answer && !iAmCaller) {
    data.answer = answer;
    data.status = "active";
    data.answeredAt = new Date();
  }
  if (status === "ended" || status === "declined" || status === "missed") {
    data.status = status;
    data.endedAt = new Date();
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });

  await prisma.callSession.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
