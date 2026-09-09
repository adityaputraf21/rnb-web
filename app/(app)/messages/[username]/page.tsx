import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { convPair, canDM } from "@/lib/dm";
import { Chat } from "@/components/dm/chat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `Chat dengan @${username}` };
}

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const me = await requireUser(`/messages/${username}`);

  const other = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, name: true, image: true },
  });
  if (!other || other.id === me.id) notFound();

  const [aId, bId] = convPair(me.id, other.id);
  const conv = await prisma.conversation.findUnique({
    where: { aId_bId: { aId, bId } },
  });

  const messages = conv
    ? await prisma.message.findMany({
        where: { conversationId: conv.id },
        orderBy: { createdAt: "asc" },
        take: 60,
      })
    : [];

  if (conv) {
    await prisma.message.updateMany({
      where: { conversationId: conv.id, senderId: other.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return (
    <div className="mx-auto max-w-lg">
      <Chat
        other={other}
        canMessage={await canDM(me.id, other.id)}
        initialMessages={messages.map((m) => ({
          id: m.id,
          body: m.body,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          createdAt: m.createdAt.toISOString(),
          mine: m.senderId === me.id,
          read: !!m.readAt,
          edited: !!m.editedAt,
          deleted: !!m.deletedAt,
        }))}
      />
    </div>
  );
}
