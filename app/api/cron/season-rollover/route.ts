import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { seasonRollover } from "@/lib/season";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await seasonRollover()) });
}

export const POST = GET;
