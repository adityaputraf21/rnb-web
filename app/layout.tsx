import type { Metadata } from "next";
import "./globals.css";
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
            RnB · Rise Never Break · tekan{" "}
            <kbd className="rounded border px-1 text-xs">Ctrl</kbd>+
            <kbd className="rounded border px-1 text-xs">K</kbd> untuk cari
          </footer>
        </Providers>
      </body>
    </html>
  );
}
