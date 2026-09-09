import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MENTION_RE = /(?<![\w`])@([a-z0-9][a-z0-9-]{1,23})/gi;

/** Ambil daftar username unik yang di-mention di teks markdown. */
export function extractMentions(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(MENTION_RE)) out.add(m[1].toLowerCase());
  return [...out];
}

const PREF_FIELD: Partial<
  Record<
    NotificationType,
    "notifyMention" | "notifyReply" | "notifyReaction" | "notifyFollow"
  >
> = {
  MENTION: "notifyMention",
  REPLY: "notifyReply",
  REACTION: "notifyReaction",
  FOLLOW: "notifyFollow",
};

export async function notify(input: {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  url?: string;
}) {
  if (input.actorId && input.actorId === input.userId) return; // jangan notif diri sendiri

  // Hormati preferensi + jangan notif dari user yang saling blokir.
  const field = PREF_FIELD[input.type];
  if (field) {
    const recipient = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        notifyMention: true,
        notifyReply: true,
        notifyReaction: true,
        notifyFollow: true,
      },
    });
    if (recipient && recipient[field] === false) return;
  }
  if (input.actorId) {
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: input.userId, blockedId: input.actorId },
          { blockerId: input.actorId, blockedId: input.userId },
        ],
      },
      select: { id: true },
    });
    if (blocked) return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url,
    },
  });
}

/** Buat notifikasi MENTION untuk setiap username valid yang disebut. */
export async function notifyMentions(input: {
  body: string;
  actorId: string;
  actorName: string;
  url: string;
  context: string;
}) {
  const usernames = extractMentions(input.body);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true },
  });

  await Promise.all(
    users.map((u) =>
      notify({
        userId: u.id,
        actorId: input.actorId,
        type: "MENTION",
        title: `${input.actorName} menyebut kamu`,
        body: input.context,
        url: input.url,
      }),
    ),
  );
}
