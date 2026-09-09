import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { options: true },
  });
  if (!poll) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (poll.closesAt && poll.closesAt < new Date())
    return NextResponse.json({ error: "polling sudah ditutup" }, { status: 403 });

  const { optionIds } = await req.json().catch(() => ({}));
  const chosen: string[] = Array.isArray(optionIds)
    ? optionIds.filter((o) => poll.options.some((op) => op.id === o))
    : [];
  if (chosen.length === 0)
    return NextResponse.json({ error: "pilih opsi" }, { status: 400 });
  if (!poll.multiple && chosen.length > 1)
    return NextResponse.json({ error: "hanya boleh 1 pilihan" }, { status: 400 });

  // Reset suara lama user di poll ini, lalu simpan yang baru.
  await prisma.pollVote.deleteMany({ where: { pollId: id, userId: user.id } });
  await prisma.pollVote.createMany({
    data: chosen.map((optionId) => ({
      pollId: id,
      optionId,
      userId: user.id,
    })),
  });

  const counts = await prisma.pollVote.groupBy({
    by: ["optionId"],
    where: { pollId: id },
    _count: { optionId: true },
  });
  return NextResponse.json({
    voted: chosen,
    counts: counts.map((c) => ({ optionId: c.optionId, count: c._count.optionId })),
  });
}
