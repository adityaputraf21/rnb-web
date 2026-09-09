import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
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
  const call = await prisma.callSession.findUnique({ where: { id } });
  if (!call || (call.callerId !== me.id && call.calleeId !== me.id))
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data } = await req.json().catch(() => ({}));
  if (!data) return NextResponse.json({ error: "kosong" }, { status: 400 });

  await prisma.callCandidate.create({
    data: {
      callId: id,
      fromCaller: call.callerId === me.id,
      data,
    },
  });
  return NextResponse.json({ ok: true });
}
