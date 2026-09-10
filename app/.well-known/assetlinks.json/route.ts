import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Digital Asset Links untuk Android TWA (aplikasi Play Store).
 * Isi ANDROID_CERT_SHA256 dengan sidik jari SHA-256 dari signing key APK
 * (dipisah koma kalau lebih dari satu). Dapat dari PWABuilder / Play Console.
 */
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME ?? "app.vercel.rnb_web.twa";
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const body = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: pkg,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];

  return NextResponse.json(body, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
