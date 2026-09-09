import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cronAuthorized } from "@/lib/cron-auth";
import { notify, notifyMentions } from "@/lib/notifications";
import { awardPoints } from "@/lib/points";
import { checkAchievements } from "@/lib/achievements";
import { bumpHashtags } from "@/lib/hashtags";
import { weeklyDigest } from "@/lib/digest";
import { seasonRollover } from "@/lib/season";
import { periodKey } from "@/lib/quests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function publishScheduled() {
  const due = await prisma.status.findMany({
    where: {
      deletedAt: null,
      mentionsSentAt: null,
      publishAt: { lte: new Date() },
    },
    take: 50,
    include: { author: { select: { id: true, username: true, name: true } } },
  });

  for (const s of due) {
    await prisma.status.update({
      where: { id: s.id },
      data: { mentionsSentAt: new Date() },
    });
    if (!s.author) continue;
    await awardPoints(s.author.id, 3).catch(() => {});
    await checkAchievements(s.author.id).catch(() => {});
    await bumpHashtags(s.body).catch(() => {});
    await notifyMentions({
      body: s.body,
      actorId: s.author.id,
      actorName: s.author.name ?? s.author.username,
      url: `/feed/${s.id}`,
      context: "di feed",
    }).catch(() => {});
  }
  return due.length;
}

async function clearExpiredBans() {
  const res = await prisma.user.updateMany({
    where: { bannedAt: { not: null }, bannedUntil: { lt: new Date() } },
    data: { bannedAt: null, bannedUntil: null, banReason: null },
  });
  return res.count;
}

async function eventReminders() {
  const now = Date.now();
  // Event yang mulai dalam 24 jam ke depan (cron harian -> "besok").
  const soon = await prisma.event.findMany({
    where: {
      startsAt: { gte: new Date(now), lte: new Date(now + 26 * 60 * 60000) },
    },
    include: {
      rsvps: { where: { status: "going" }, select: { userId: true } },
    },
  });
  let sent = 0;
  for (const e of soon) {
    const already = await prisma.auditLog.findFirst({
      where: { action: "event.reminder", targetId: e.id },
      select: { id: true },
    });
    if (already) continue;
    await prisma.auditLog.create({
      data: {
        action: "event.reminder",
        targetType: "event",
        targetId: e.id,
        meta: {},
      },
    });
    for (const r of e.rsvps) {
      await notify({
        userId: r.userId,
        type: "SYSTEM",
        title: `Pengingat: ${e.title}`,
        body: "Dalam 24 jam ke depan",
        url: "/events",
      }).catch(() => {});
      sent += 1;
    }
  }
  return sent;
}

/** Rekap mingguan sekali per pekan ISO (idempoten via AuditLog). */
async function maybeWeeklyDigest() {
  const now = new Date();
  if (now.getUTCDay() !== 1) return null; // hanya Senin
  const wk = periodKey("weekly", now);
  const done = await prisma.auditLog.findFirst({
    where: { action: "cron.weekly-digest", targetId: wk },
    select: { id: true },
  });
  if (done) return null;
  await prisma.auditLog.create({
    data: {
      action: "cron.weekly-digest",
      targetType: "cron",
      targetId: wk,
      meta: {},
    },
  });
  return weeklyDigest().catch(() => null);
}

async function run() {
  const [published, unbanned, reminders] = await Promise.all([
    publishScheduled(),
    clearExpiredBans(),
    eventReminders(),
  ]);
  const digest = await maybeWeeklyDigest();
  const season = await seasonRollover().catch(() => null);
  return { published, unbanned, reminders, digest: !!digest, season };
}

export async function GET(req: Request) {
  if (!cronAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await run()) });
}

export const POST = GET;
