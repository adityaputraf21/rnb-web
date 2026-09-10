import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }

  // OWNER tidak boleh menghapus diri sendiri (biar situs tak kehilangan owner).
  if (me.role === "OWNER")
    return NextResponse.json(
      { error: "Owner tidak bisa menghapus akun. Turunkan role dulu." },
      { status: 403 },
    );

  const { confirm } = await req.json().catch(() => ({}));
  if (typeof confirm !== "string" || confirm.toLowerCase() !== me.username)
    return NextResponse.json(
      { error: "Konfirmasi username tidak cocok." },
      { status: 400 },
    );

  // Anonimkan konten publik yang sebaiknya tetap ada konteksnya.
  await prisma.$transaction([
    prisma.thread.updateMany({ where: { authorId: me.id }, data: { authorId: null } }),
    prisma.post.updateMany({ where: { authorId: me.id }, data: { authorId: null } }),
    prisma.status.updateMany({ where: { authorId: me.id }, data: { authorId: null } }),
    prisma.statusComment.updateMany({
      where: { authorId: me.id },
      data: { authorId: null },
    }),
    prisma.wikiRevision.updateMany({
      where: { editorId: me.id },
      data: { editorId: null },
    }),
    prisma.listing.deleteMany({ where: { sellerId: me.id } }),
  ]);

  // Hapus user -> cascade menghapus akun, sesi, DM, follow, story, dll.
  await prisma.user.delete({ where: { id: me.id } });

  return NextResponse.json({ ok: true });
}
