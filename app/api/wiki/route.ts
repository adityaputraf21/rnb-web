import { NextResponse } from "next/server";
import { apiWriter, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { slugBase } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const pages = await prisma.wikiPage.findMany({
    orderBy: { title: "asc" },
    select: { slug: true, title: true, updatedAt: true },
  });
  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { title, body, summary } = await req.json().catch(() => ({}));
  const t = typeof title === "string" ? title.trim().slice(0, 160) : "";
  if (t.length < 2)
    return NextResponse.json({ error: "judul terlalu pendek" }, { status: 400 });

  let slug = slugBase(t);
  if (await prisma.wikiPage.findUnique({ where: { slug } }))
    return NextResponse.json(
      { error: "halaman dengan judul serupa sudah ada" },
      { status: 409 },
    );

  const text = typeof body === "string" ? body.slice(0, 50000) : "";
  const page = await prisma.wikiPage.create({
    data: {
      slug,
      title: t,
      body: text,
      updatedById: user.id,
      revisions: {
        create: {
          title: t,
          body: text,
          editorId: user.id,
          summary:
            typeof summary === "string" ? summary.slice(0, 200) : "Halaman dibuat",
        },
      },
    },
  });
  return NextResponse.json({ slug: page.slug }, { status: 201 });
}
