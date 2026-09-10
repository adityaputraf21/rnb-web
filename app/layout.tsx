import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteBanner } from "@/components/site-banner";

export const metadata: Metadata = {
  title: {
    default: "RnB — Komunitas Rise Never Break",
    template: "%s · RnB",
  },
  description:
    "Komunitas RnB — feed, forum, stories, dan pesan langsung. Login pakai Discord.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <SiteBanner />
          <SiteHeader />
          <main className="container py-8">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            <p>
              RnB · Rise Never Break · tekan{" "}
              <kbd className="rounded border px-1 text-xs">Ctrl</kbd>+
              <kbd className="rounded border px-1 text-xs">K</kbd> untuk cari
            </p>
            <p className="mt-2 space-x-3">
              <Link href="/terms" className="hover:underline">
                Ketentuan
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privasi
              </Link>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
