import { NextResponse } from "next/server";
import { apiWriter, apiRole, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { modLog } from "@/lib/mod-log";
import { assertWikiRate } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  let user;
  try {
    user = await apiWriter();
    await assertWikiRate(user.id);
  } catch (res) {
    return res as Response;
  }
  const { slug } = await params;
  const page = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!page)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (page.locked && !hasRole(user, "MODERATOR"))
    return NextResponse.json(
      { error: "halaman terkunci — hanya moderator" },
      { status: 403 },
    );

  const { title, body, summary } = await req.json().catch(() => ({}));
  const newTitle =
    typeof title === "string" && title.trim()
      ? title.trim().slice(0, 160)
      : page.title;
  const newBody = typeof body === "string" ? body.slice(0, 50000) : page.body;

  if (newTitle === page.title && newBody === page.body)
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });

  await prisma.$transaction([
    prisma.wikiRevision.create({
      data: {
        pageId: page.id,
        title: newTitle,
        body: newBody,
        editorId: user.id,
        summary:
          typeof summary === "string" ? summary.slice(0, 200) || null : null,
      },
    }),
    prisma.wikiPage.update({
      where: { id: page.id },
      data: { title: newTitle, body: newBody, updatedById: user.id },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

/** Kunci / buka kunci halaman (moderator). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { slug } = await params;
  const page = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!page)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { locked } = await req.json().catch(() => ({}));
  await prisma.wikiPage.update({
    where: { id: page.id },
    data: { locked: !!locked },
  });
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: locked ? "wiki.lock" : "wiki.unlock",
    targetType: "wiki",
    targetId: page.id,
    summary: `"${page.title}" ${locked ? "dikunci" : "dibuka"}`,
  });
  return NextResponse.json({ locked: !!locked });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { slug } = await params;
  const page = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!page)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.wikiPage.delete({ where: { id: page.id } });
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "wiki.delete",
    targetType: "wiki",
    targetId: page.id,
    summary: `"${page.title}" dihapus`,
  });
  return NextResponse.json({ ok: true });
}
