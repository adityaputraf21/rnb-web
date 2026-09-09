import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function subscribe(userId: string, threadId: string) {
  await prisma.threadSubscription
    .create({ data: { userId, threadId } })
    .catch(() => {});
}

export async function unsubscribe(userId: string, threadId: string) {
  await prisma.threadSubscription
    .deleteMany({ where: { userId, threadId } })
    .catch(() => {});
}

/** Beri tahu semua pengikut thread (kecuali si pembalas & OP yang sudah dinotif). */
export async function notifySubscribers(input: {
  threadId: string;
  threadTitle: string;
  actorId: string;
  actorName: string;
  url: string;
  excludeUserIds: string[];
}) {
  const subs = await prisma.threadSubscription.findMany({
    where: {
      threadId: input.threadId,
      userId: { notIn: [input.actorId, ...input.excludeUserIds] },
    },
    select: { userId: true },
  });
  await Promise.all(
    subs.map((s) =>
      notify({
        userId: s.userId,
        actorId: input.actorId,
        type: "REPLY",
        title: `Balasan baru di "${input.threadTitle}"`,
        body: `${input.actorName} membalas thread yang kamu ikuti`,
        url: input.url,
      }),
    ),
  );
}
