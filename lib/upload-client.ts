"use client";

import { upload } from "@vercel/blob/client";
import { ALLOWED_UPLOAD_TYPES, limitFor, kindOf } from "@/lib/upload-limits";

export type Uploaded = {
  url: string;
  contentType: string;
  name: string;
  kind: "image" | "video" | "audio" | "file";
};

/** Upload satu file langsung ke Vercel Blob dari browser (mendukung file besar). */
export async function uploadFile(
  file: File,
  opts: { prefix?: string; onProgress?: (pct: number) => void } = {},
): Promise<Uploaded> {
  const ct = file.type || "application/octet-stream";
  if (!ALLOWED_UPLOAD_TYPES.includes(ct)) {
    throw new Error(`Tipe file tidak didukung (${ct || "?"})`);
  }
  if (file.size > limitFor(ct)) {
    throw new Error(
      `File terlalu besar (maks ${Math.round(limitFor(ct) / 1024 / 1024)}MB untuk ${kindOf(ct)})`,
    );
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeName = `${crypto.randomUUID()}.${ext}`;
  const pathname = `${opts.prefix ?? "u"}/${safeName}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
    contentType: ct,
    clientPayload: JSON.stringify({ contentType: ct }),
    onUploadProgress: opts.onProgress
      ? (p) => opts.onProgress!(p.percentage)
      : undefined,
  });

  return { url: blob.url, contentType: ct, name: file.name, kind: kindOf(ct) };
}
