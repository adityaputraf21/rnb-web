import { NextResponse } from "next/server";
import { apiWriter, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  let user;
  try {
    user = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { slug } = await params;
  const page = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!page)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (page.locked && !hasRole(user, "MODERATOR"))
    return NextResponse.json({ error: "halaman terkunci" }, { status: 403 });

  const { revisionId } = await req.json().catch(() => ({}));
  const rev = await prisma.wikiRevision.findUnique({ where: { id: revisionId } });
  if (!rev || rev.pageId !== page.id)
    return NextResponse.json({ error: "revisi tidak ditemukan" }, { status: 404 });

  await prisma.$transaction([
    prisma.wikiRevision.create({
      data: {
        pageId: page.id,
        title: rev.title,
        body: rev.body,
        editorId: user.id,
        summary: `Dikembalikan ke versi ${rev.createdAt.toISOString().slice(0, 16).replace("T", " ")}`,
      },
    }),
    prisma.wikiPage.update({
      where: { id: page.id },
      data: { title: rev.title, body: rev.body, updatedById: user.id },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
