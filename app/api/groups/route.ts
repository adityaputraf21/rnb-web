import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { listMyGroups } from "@/lib/group";
import { canDM } from "@/lib/dm";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  return NextResponse.json(await listMyGroups(user.id));
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { name, usernames } = await req.json().catch(() => ({}));
  const clean = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!clean)
    return NextResponse.json({ error: "nama grup wajib" }, { status: 400 });

  const list: string[] = Array.isArray(usernames)
    ? usernames
        .map((u: unknown) => String(u).toLowerCase().trim())
        .filter(Boolean)
        .slice(0, 49)
    : [];

  const others = await prisma.user.findMany({
    where: { username: { in: list } },
    select: { id: true },
  });
  const memberIds = new Set<string>([user.id]);
  for (const o of others) {
    if (o.id !== user.id && (await canDM(user.id, o.id))) memberIds.add(o.id);
  }
  if (memberIds.size < 2)
    return NextResponse.json(
      { error: "tambahkan minimal 1 anggota lain" },
      { status: 400 },
    );

  const group = await prisma.groupChat.create({
    data: {
      name: clean,
      ownerId: user.id,
      members: {
        create: [...memberIds].map((id) => ({
          userId: id,
          role: id === user.id ? "owner" : "member",
        })),
      },
    },
  });

  return NextResponse.json({ id: group.id }, { status: 201 });
}
