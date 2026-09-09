import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { questProgress } from "@/lib/quests";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  return NextResponse.json(await questProgress(user.id));
}
