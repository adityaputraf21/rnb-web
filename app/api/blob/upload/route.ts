import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ALLOWED_UPLOAD_TYPES, limitFor } from "@/lib/upload-limits";

export const runtime = "nodejs";

/**
 * Endpoint token untuk client-upload Vercel Blob.
 * File dikirim browser -> Blob langsung (lewati batas body serverless 4.5MB),
 * jadi video besar & file besar didukung.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Harus login untuk upload");
        if (user.banned) throw new Error("Akun diblokir");

        const ct =
          (clientPayload && JSON.parse(clientPayload)?.contentType) || "";
        return {
          allowedContentTypes: ALLOWED_UPLOAD_TYPES,
          maximumSizeInBytes: limitFor(ct || "application/octet-stream"),
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: user.id,
            username: user.username,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Hanya jalan di lingkungan dengan URL publik (Vercel), bukan localhost.
        try {
          const { userId } = JSON.parse(tokenPayload ?? "{}");
          if (userId) {
            await prisma.attachment.create({
              data: {
                url: blob.url,
                pathname: blob.pathname,
                name: blob.pathname.split("/").pop() ?? "file",
                contentType: blob.contentType ?? "application/octet-stream",
                size: 0,
                uploaderId: userId,
              },
            });
          }
        } catch (e) {
          console.error("[blob] onUploadCompleted:", e);
        }
      },
    });

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 },
    );
  }
}
