import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate ringan berbasis cookie sesi (bukan verifikasi kripto — itu dilakukan
 * di server oleh (app)/layout.tsx). Tujuannya: redirect cepat tanpa flash
 * untuk pengunjung yang jelas belum login, dan menyisipkan header x-pathname.
 */
const PUBLIC = [
  "/",
  "/login",
  "/banned",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.svg",
  "/sw.js",
];

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);

  // Simpan kode undangan dari ?ref= untuk diklaim setelah login.
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[a-z0-9]{4,12}$/i.test(ref) && !req.cookies.has("rnb_ref")) {
    res.cookies.set("rnb_ref", ref, {
      maxAge: 7 * 86400,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  const isPublic =
    PUBLIC.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/discord");

  if (isPublic) return res;

  const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
  if (!hasSession && !pathname.startsWith("/api/")) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
