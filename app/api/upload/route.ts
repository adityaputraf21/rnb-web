import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  uploadToBlob,
  MAX_UPLOAD_BYTES,
  ALLOWED_UPLOAD_TYPES,
} from "@/lib/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file tidak ada" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `maksimal ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB` },
      { status: 413 },
    );
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `tipe file tidak didukung (${file.type || "unknown"})` },
      { status: 415 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "upload belum dikonfigurasi (BLOB_READ_WRITE_TOKEN)" },
      { status: 501 },
    );
  }

  try {
    const meta = await uploadToBlob(file, `u/${user.username}`);
    const attachment = await prisma.attachment.create({
      data: { ...meta, uploaderId: user.id },
    });
    return NextResponse.json({
      id: attachment.id,
      url: meta.url,
      name: meta.name,
      contentType: meta.contentType,
    });
  } catch (err) {
    console.error("[upload] gagal:", err);
    return NextResponse.json({ error: "gagal upload" }, { status: 500 });
  }
}
