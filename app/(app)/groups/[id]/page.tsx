import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { groupMembership } from "@/lib/group";
import { GroupChat } from "@/components/dm/group-chat";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const g = await prisma.groupChat.findUnique({ where: { id } });
  return { title: g ? g.name : "Grup" };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser(`/groups/${id}`);

  const membership = await groupMembership(id, me.id);
  if (!membership) notFound();

  const group = await prisma.groupChat.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { username: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 60,
        include: {
          sender: { select: { username: true, name: true, image: true } },
        },
      },
    },
  });
  if (!group) notFound();

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId: id, userId: me.id } },
    data: { lastReadAt: new Date() },
  });

  return (
    <div className="mx-auto max-w-lg">
      <GroupChat
        group={{ id: group.id, name: group.name }}
        iAmOwner={group.ownerId === me.id}
        members={group.members.map((m) => ({
          username: m.user.username,
          name: m.user.name,
          image: m.user.image,
          role: m.role,
        }))}
        initialMessages={group.messages.map((m) => ({
          id: m.id,
          body: m.body,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          createdAt: m.createdAt.toISOString(),
          mine: m.senderId === me.id,
          edited: !!m.editedAt,
          deleted: !!m.deletedAt,
          sender: {
            username: m.sender?.username ?? "?",
            name: m.sender?.name ?? null,
            image: m.sender?.image ?? null,
          },
        }))}
      />
    </div>
  );
}
