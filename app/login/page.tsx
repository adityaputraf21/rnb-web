import Link from "next/link";
import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton } from "@/components/sign-in-button";

export const metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const { callbackUrl, error } = await searchParams;
  if (user) redirect(callbackUrl || "/feed");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center">
      <Card>
        <CardHeader className="items-center text-center">
          <MessagesSquare className="h-8 w-8 text-primary" />
          <CardTitle>Masuk ke RnB</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          {error === "guild" && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              Kamu harus jadi anggota server Discord komunitas dulu untuk masuk.
            </p>
          )}
          {error && error !== "guild" && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              Login gagal. Coba lagi.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Login pakai akun Discord kamu. Username & avatar diambil otomatis.
          </p>
          <SignInButton
            size="lg"
            className="w-full"
            callbackUrl={callbackUrl || "/feed"}
          />
          <p className="text-xs text-muted-foreground">
            Dengan masuk kamu setuju menjaga forum tetap sehat.{" "}
            <Link href="/" className="underline">
              Kembali
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
