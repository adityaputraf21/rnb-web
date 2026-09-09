import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const FIELDS = [
  "notifyMention",
  "notifyReply",
  "notifyReaction",
  "notifyFollow",
] as const;

export async function PATCH(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const b = await req.json().catch(() => ({}));
  const data: Record<string, boolean> = {};
  for (const f of FIELDS) {
    if (typeof b[f] === "boolean") data[f] = b[f];
  }
  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
