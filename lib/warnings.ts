import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { modLog } from "@/lib/mod-log";

/**
 * Terbitkan peringatan. Auto-eskalasi berdasarkan jumlah peringatan aktif
 * (belum kedaluwarsa): 3 -> timeout 24 jam, 5 -> ban permanen.
 */
export async function issueWarning(input: {
  userId: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  severity?: number;
}) {
  await prisma.warning.create({
    data: {
      userId: input.userId,
      moderatorId: input.moderatorId,
      reason: input.reason,
      severity: input.severity ?? 1,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 hari
    },
  });

  const active = await prisma.warning.count({
    where: {
      userId: input.userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  let escalation = "";
  if (active >= 5) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { bannedAt: new Date(), banReason: "5 peringatan aktif (otomatis)" },
    });
    escalation = " → akun diblokir otomatis (5 peringatan)";
  } else if (active >= 3) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { mutedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    escalation = " → timeout 24 jam otomatis (3 peringatan)";
  }

  await notify({
    userId: input.userId,
    actorId: input.moderatorId,
    type: "MOD_ACTION",
    title: `Kamu menerima peringatan (${active} aktif)`,
    body: `${input.reason}${escalation}`,
  });

  await modLog({
    moderatorId: input.moderatorId,
    moderatorName: input.moderatorName,
    action: "user.warn",
    targetType: "user",
    targetId: input.userId,
    summary: `Peringatan: ${input.reason} (total aktif ${active})${escalation}`,
  });

  return { active, escalation };
}
