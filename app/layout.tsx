import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "RnB — Komunitas Rise Never Break",
    template: "%s · RnB",
  },
  description:
    "Forum komunitas RnB: diskusi, event, leaderboard, dan pengumuman — terintegrasi dengan Discord.",
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
          <SiteHeader />
          <main className="container py-8">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            RnB · Rise Never Break — dibangun dengan Next.js & Discord
          </footer>
        </Providers>
      </body>
    </html>
  );
}
