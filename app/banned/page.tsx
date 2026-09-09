import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppealForm } from "@/components/appeal-form";

export const metadata = { title: "Akun diblokir" };
export const dynamic = "force-dynamic";

export default async function BannedPage() {
  const session = await auth();
  const uid = session?.user?.id;
  const [me, appeals] = await Promise.all([
    uid
      ? prisma.user.findUnique({
          where: { id: uid },
          select: { banReason: true },
        })
      : null,
    uid
      ? prisma.appeal.findMany({
          where: { userId: uid },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [],
  ]);
  const reason = me?.banReason ?? null;

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
          <p>Kalau menurutmu ini keliru, ajukan banding di bawah.</p>
        </CardContent>
      </Card>

      {session?.user && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Ajukan banding</CardTitle>
          </CardHeader>
          <CardContent>
            <AppealForm
              initial={appeals.map((a) => ({
                id: a.id,
                body: a.body,
                status: a.status,
                note: a.note,
                createdAt: a.createdAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
