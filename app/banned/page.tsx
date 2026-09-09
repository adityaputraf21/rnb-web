import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Akun diblokir" };

export default async function BannedPage() {
  const session = await auth();
  const reason = session?.user
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { banReason: true },
        })
      )?.banReason
    : null;

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Akun kamu diblokir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Kamu tidak bisa memposting atau berinteraksi di forum saat ini.</p>
          {reason && (
            <p>
              Alasan: <span className="text-foreground">{reason}</span>
            </p>
          )}
          <p>Hubungi moderator di Discord kalau menurutmu ini keliru.</p>
        </CardContent>
      </Card>
    </div>
  );
}
