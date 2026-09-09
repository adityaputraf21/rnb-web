import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toUsernameSlug } from "@/lib/username";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { name, username, bio, website, bannerColor } = await req
    .json()
    .catch(() => ({}));
  const data: Record<string, string | null> = {};

  if (typeof name === "string") data.name = name.trim().slice(0, 60) || null;
  if (typeof bio === "string") data.bio = bio.trim().slice(0, 500) || null;
  if (typeof website === "string") {
    const w = website.trim().slice(0, 120);
    data.website = w && /^https?:\/\//.test(w) ? w : w ? `https://${w}` : null;
  }
  if (typeof bannerColor === "string")
    data.bannerColor = /^#[0-9a-f]{6}$/i.test(bannerColor) ? bannerColor : null;

  if (typeof username === "string") {
    const slug = toUsernameSlug(username);
    if (slug.length < 3) {
      return NextResponse.json(
        { error: "username minimal 3 karakter (huruf/angka/-)" },
        { status: 400 },
      );
    }
    if (slug !== user.username) {
      const taken = await prisma.user.findUnique({ where: { username: slug } });
      if (taken) {
        return NextResponse.json(
          { error: "username sudah dipakai" },
          { status: 409 },
        );
      }
      data.username = slug;
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      name: true,
      username: true,
      bio: true,
      website: true,
      bannerColor: true,
    },
  });
  return NextResponse.json(updated);
}
