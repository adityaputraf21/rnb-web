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
    "Forum komunitas RnB: diskusi, feed, event, leaderboard, dan pengumuman — terintegrasi dengan Discord.",
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
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
            RnB · Rise Never Break ·{" "}
            <a href="/rss.xml" className="hover:underline">
              RSS
            </a>{" "}
            · <kbd className="rounded border px-1 text-xs">Ctrl</kbd>+
            <kbd className="rounded border px-1 text-xs">K</kbd> untuk cari
          </footer>
        </Providers>
      </body>
    </html>
  );
}
