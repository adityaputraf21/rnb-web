import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { canDM } from "@/lib/dm";
import { notify } from "@/lib/notifications";
import { assertCallRate } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** Panggilan masuk/aktif untuk user ini. */
export async function GET() {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const call = await prisma.callSession.findFirst({
    where: {
      OR: [{ callerId: me.id }, { calleeId: me.id }],
      status: { in: ["ringing", "active"] },
      startedAt: { gt: new Date(Date.now() - 2 * 60000) },
    },
    orderBy: { startedAt: "desc" },
    include: {
      caller: { select: { username: true, name: true, image: true } },
      callee: { select: { username: true, name: true, image: true } },
    },
  });
  if (!call) return NextResponse.json({ call: null });

  return NextResponse.json({
    call: {
      id: call.id,
      kind: call.kind,
      status: call.status,
      iAmCaller: call.callerId === me.id,
      peer: call.callerId === me.id ? call.callee : call.caller,
    },
  });
}

export async function POST(req: Request) {
  let me;
  try {
    me = await apiUser();
    await assertCallRate(me.id);
  } catch (res) {
    return res as Response;
  }
  const { username, kind } = await req.json().catch(() => ({}));
  const callee = await prisma.user.findUnique({
    where: { username: String(username ?? "").toLowerCase() },
    select: { id: true, username: true, name: true, image: true },
  });
  if (!callee || callee.id === me.id)
    return NextResponse.json({ error: "user tidak valid" }, { status: 400 });
  if (!(await canDM(me.id, callee.id)))
    return NextResponse.json(
      { error: "tidak bisa menghubungi pengguna ini" },
      { status: 403 },
    );

  // Bersihkan panggilan lama yang menggantung.
  await prisma.callSession.updateMany({
    where: {
      OR: [{ callerId: me.id }, { calleeId: me.id }],
      status: { in: ["ringing", "active"] },
    },
    data: { status: "ended", endedAt: new Date() },
  });

  const busy = await prisma.callSession.findFirst({
    where: {
      OR: [{ callerId: callee.id }, { calleeId: callee.id }],
      status: { in: ["ringing", "active"] },
      startedAt: { gt: new Date(Date.now() - 60000) },
    },
  });
  if (busy)
    return NextResponse.json({ error: "pengguna sedang sibuk" }, { status: 409 });

  const call = await prisma.callSession.create({
    data: {
      callerId: me.id,
      calleeId: callee.id,
      kind: kind === "audio" ? "audio" : "video",
    },
  });

  void notify({
    userId: callee.id,
    actorId: me.id,
    type: "DM",
    title: `📞 Panggilan ${call.kind === "audio" ? "suara" : "video"} dari ${me.name ?? me.username}`,
    body: "Ketuk untuk menjawab",
    url: `/messages/${me.username}?call=${call.id}`,
  });

  return NextResponse.json({ id: call.id, kind: call.kind });
}
