// Konstanta batas upload — aman diimpor dari client & server.

/** Batas per tipe (byte). Video besar diizinkan lewat client-upload Vercel Blob. */
export const UPLOAD_LIMITS = {
  image: 25 * 1024 * 1024, // 25 MB
  video: 512 * 1024 * 1024, // 512 MB
  file: 100 * 1024 * 1024, // 100 MB
};

export const ALLOWED_UPLOAD_TYPES = [
  // gambar
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  // video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  // audio
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  // dokumen
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
];

export function kindOf(contentType: string): "image" | "video" | "audio" | "file" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "file";
}

export function limitFor(contentType: string): number {
  const k = kindOf(contentType);
  if (k === "video") return UPLOAD_LIMITS.video;
  if (k === "image") return UPLOAD_LIMITS.image;
  return UPLOAD_LIMITS.file;
}

// Kompat lama
export const MAX_UPLOAD_BYTES = UPLOAD_LIMITS.file;
