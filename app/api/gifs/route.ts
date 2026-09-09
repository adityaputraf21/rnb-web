import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

type TenorResult = {
  id: string;
  media_formats: Record<string, { url: string; dims: number[] }>;
  content_description?: string;
};

export async function GET(req: Request) {
  if (!(await getCurrentUser()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = process.env.TENOR_API_KEY;
  if (!key) return NextResponse.json({ disabled: true, results: [] });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const base = q
    ? "https://tenor.googleapis.com/v2/search"
    : "https://tenor.googleapis.com/v2/featured";
  const params = new URLSearchParams({
    key,
    client_key: "rnb_web",
    limit: "24",
    media_filter: "gif,tinygif",
    contentfilter: "medium",
  });
  if (q) params.set("q", q);

  try {
    const res = await fetch(`${base}?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = (await res.json()) as { results: TenorResult[] };
    return NextResponse.json({
      results: data.results.map((r) => ({
        id: r.id,
        url: r.media_formats.gif?.url ?? r.media_formats.tinygif?.url,
        preview: r.media_formats.tinygif?.url ?? r.media_formats.gif?.url,
        alt: r.content_description ?? "gif",
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
