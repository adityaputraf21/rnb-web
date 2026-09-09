import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notifications";

const INVITER_REWARD = 25;

function genCode() {
  return Math.random().toString(36).slice(2, 8);
}

/** Ambil (atau buat) kode undangan milik user. */
export async function getOrCreateInvite(userId: string) {
  const existing = await prisma.invite.findFirst({
    where: { inviterId: userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    try {
      return await prisma.invite.create({
        data: { code: genCode(), inviterId: userId },
      });
    } catch {
      /* tabrakan kode, coba lagi */
    }
  }
  return prisma.invite.create({
    data: { code: `${genCode()}${genCode()}`.slice(0, 10), inviterId: userId },
  });
}

/**
 * Terapkan undangan tertunda (cookie rnb_ref) untuk user yang baru mendaftar.
 * Idempoten: hanya jalan kalau user belum punya invitedById & akun masih baru.
 */
export async function applyPendingInvite(userId: string) {
  let code: string | undefined;
  try {
    code = (await cookies()).get("rnb_ref")?.value;
  } catch {
    return;
  }
  if (!code) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { invitedById: true, createdAt: true },
  });
  if (!user || user.invitedById) return;
  if (Date.now() - user.createdAt.getTime() > 60 * 60 * 1000) return; // >1 jam

  const invite = await prisma.invite.findUnique({ where: { code } });
  if (!invite || invite.inviterId === userId) return;
  if (invite.expiresAt && invite.expiresAt < new Date()) return;
  if (invite.maxUses > 0 && invite.uses >= invite.maxUses) return;

  await prisma.user.update({
    where: { id: userId },
    data: { invitedById: invite.inviterId },
  });
  await prisma.invite.update({
    where: { id: invite.id },
    data: { uses: { increment: 1 } },
  });
  await awardPoints(invite.inviterId, INVITER_REWARD).catch(() => {});
  await notify({
    userId: invite.inviterId,
    type: "SYSTEM",
    title: "Undanganmu dipakai! 🎉",
    body: `+${INVITER_REWARD} poin`,
    url: "/invite",
  }).catch(() => {});
}
