import { MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ConversationList } from "@/components/dm/conversation-list";

export const metadata = { title: "Pesan" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const me = await requireUser("/messages");

  const convs = await prisma.conversation.findMany({
    where: { OR: [{ aId: me.id }, { bId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      a: { select: { id: true, username: true, name: true, image: true } },
      b: { select: { id: true, username: true, name: true, image: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const initial = await Promise.all(
    convs.map(async (c) => {
      const other = c.aId === me.id ? c.b : c.a;
      const unread = await prisma.message.count({
        where: { conversationId: c.id, readAt: null, senderId: other.id },
      });
      const last = c.messages[0];
      return {
        username: other.username,
        name: other.name,
        image: other.image,
        lastMessage: last
          ? last.mediaUrl && !last.body
            ? "📎 Lampiran"
            : last.body.slice(0, 80)
          : "",
        lastAt: (last?.createdAt ?? c.lastMessageAt).toISOString(),
        unread,
        mine: last?.senderId === me.id,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Pesan</h1>
      </div>
      <Card className="overflow-hidden p-0">
        <ConversationList initial={initial} />
      </Card>
    </div>
  );
}
