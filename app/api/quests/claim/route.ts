import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notifications";
import { QUESTS, periodKey, questProgress } from "@/lib/quests";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { key } = await req.json().catch(() => ({}));
  const quest = QUESTS.find((q) => q.key === key);
  if (!quest)
    return NextResponse.json({ error: "quest tidak ada" }, { status: 404 });

  const pk = periodKey(quest.period);

  const already = await prisma.questClaim.findUnique({
    where: {
      userId_questKey_periodKey: {
        userId: user.id,
        questKey: quest.key,
        periodKey: pk,
      },
    },
  });
  if (already)
    return NextResponse.json({ error: "sudah diklaim" }, { status: 409 });

  // Verifikasi progress betulan sebelum memberi hadiah.
  const prog = await questProgress(user.id);
  const row = [...prog.weekly, ...prog.seasonal].find(
    (r) => r.key === quest.key,
  );
  if (!row || !row.done)
    return NextResponse.json(
      { error: "quest belum selesai" },
      { status: 400 },
    );

  await prisma.questClaim.create({
    data: {
      userId: user.id,
      questKey: quest.key,
      periodKey: pk,
      reward: quest.reward,
    },
  });
  await awardPoints(user.id, quest.reward);
  await notify({
    userId: user.id,
    type: "ACHIEVEMENT",
    title: `Quest selesai: ${quest.title}`,
    body: `+${quest.reward} poin`,
    url: "/quests",
  });

  return NextResponse.json({ ok: true, reward: quest.reward });
}
