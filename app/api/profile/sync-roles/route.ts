import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { syncGuildRoles, isInRequiredGuild } from "@/lib/discord-guild";
import { getSiteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

export async function POST() {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const cfg = await getSiteConfig();
  if (!cfg.discordGuildId)
    return NextResponse.json(
      { error: "Integrasi Discord belum dikonfigurasi." },
      { status: 400 },
    );

  const inGuild = await isInRequiredGuild(me.id);
  const result = await syncGuildRoles(me.id);

  return NextResponse.json({
    inGuild,
    role: result?.role ?? me.role,
    changed: result?.changed ?? false,
  });
}
