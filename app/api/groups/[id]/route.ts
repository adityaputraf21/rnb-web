import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { groupMembership } from "@/lib/group";
import { canDM } from "@/lib/dm";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const me = await groupMembership(id, user.id);
  if (!me)
    return NextResponse.json({ error: "bukan anggota" }, { status: 403 });

  const group = await prisma.groupChat.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { username: true, name: true, image: true } },
        },
      },
    },
  });
  if (!group)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    id: group.id,
    name: group.name,
    image: group.image,
    ownerId: group.ownerId,
    iAmOwner: group.ownerId === user.id,
    members: group.members.map((m) => ({
      username: m.user.username,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
    })),
  });
}

export async function PATCH(
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
  const me = await groupMembership(id, user.id);
  if (!me)
    return NextResponse.json({ error: "bukan anggota" }, { status: 403 });

  const group = await prisma.groupChat.findUnique({ where: { id } });
  if (!group)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { action, name, username } = await req.json().catch(() => ({}));

  if (action === "rename") {
    if (group.ownerId !== user.id)
      return NextResponse.json({ error: "khusus pembuat" }, { status: 403 });
    const clean = typeof name === "string" ? name.trim().slice(0, 60) : "";
    if (!clean)
      return NextResponse.json({ error: "nama wajib" }, { status: 400 });
    await prisma.groupChat.update({ where: { id }, data: { name: clean } });
    return NextResponse.json({ ok: true });
  }

  if (action === "leave") {
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId: user.id } },
    });
    // pembuat keluar -> pindahkan kepemilikan atau bubarkan
    if (group.ownerId === user.id) {
      const next = await prisma.groupMember.findFirst({
        where: { groupId: id },
        orderBy: { joinedAt: "asc" },
      });
      if (next) {
        await prisma.groupChat.update({
          where: { id },
          data: { ownerId: next.userId },
        });
        await prisma.groupMember.update({
          where: { id: next.id },
          data: { role: "owner" },
        });
      } else {
        await prisma.groupChat.delete({ where: { id } });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "add") {
    if (group.ownerId !== user.id)
      return NextResponse.json({ error: "khusus pembuat" }, { status: 403 });
    const target = await prisma.user.findUnique({
      where: { username: String(username ?? "").toLowerCase() },
      select: { id: true },
    });
    if (!target)
      return NextResponse.json({ error: "user tidak ada" }, { status: 404 });
    if (!(await canDM(user.id, target.id)))
      return NextResponse.json(
        { error: "tidak bisa menambahkan user ini" },
        { status: 400 },
      );
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: id, userId: target.id } },
      create: { groupId: id, userId: target.id },
      update: {},
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "read") {
    await prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId: user.id } },
      data: { lastReadAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action tidak valid" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const group = await prisma.groupChat.findUnique({ where: { id } });
  if (!group)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (group.ownerId !== user.id)
    return NextResponse.json({ error: "khusus pembuat" }, { status: 403 });

  await prisma.groupChat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
