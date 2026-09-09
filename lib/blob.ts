import { put, del } from "@vercel/blob";

export {
  MAX_UPLOAD_BYTES,
  ALLOWED_UPLOAD_TYPES,
} from "@/lib/upload-limits";

export async function uploadToBlob(file: File, prefix = "uploads") {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const blob = await put(key, file, {
    access: "public",
    contentType: file.type || undefined,
    addRandomSuffix: false,
  });
  return {
    url: blob.url,
    pathname: blob.pathname,
    name: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function deleteFromBlob(url: string) {
  try {
    await del(url);
  } catch {
    /* file mungkin sudah tidak ada — abaikan */
  }
}
