import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

type GiphyItem = {
  id: string;
  title?: string;
  images: {
    original?: { url: string };
    downsized_medium?: { url: string };
    fixed_height?: { url: string };
    fixed_height_small?: { url: string };
    fixed_width_small?: { url: string };
  };
};

export async function GET(req: Request) {
  if (!(await getCurrentUser()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = process.env.GIPHY_API_KEY;
  if (!key) return NextResponse.json({ disabled: true, results: [] });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const params = new URLSearchParams({
    api_key: key,
    limit: "24",
    rating: "pg-13",
    bundle: "messaging_non_clips",
  });
  if (q) params.set("q", q);
  const base = q
    ? "https://api.giphy.com/v1/gifs/search"
    : "https://api.giphy.com/v1/gifs/trending";

  try {
    const res = await fetch(`${base}?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = (await res.json()) as { data: GiphyItem[] };
    return NextResponse.json({
      results: (data.data ?? []).map((g) => ({
        id: g.id,
        url:
          g.images.downsized_medium?.url ??
          g.images.original?.url ??
          g.images.fixed_height?.url,
        preview:
          g.images.fixed_height_small?.url ??
          g.images.fixed_width_small?.url ??
          g.images.fixed_height?.url,
        alt: g.title ?? "gif",
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
