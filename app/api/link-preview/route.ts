import { NextResponse } from "next/server";
import { getLinkPreview } from "@/lib/link-preview";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json(null, { status: 401 });
  const url = new URL(req.url).searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url))
    return NextResponse.json({ error: "url tidak valid" }, { status: 400 });

  const preview = await getLinkPreview(url);
  if (!preview) return NextResponse.json(null);
  return NextResponse.json(preview, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
