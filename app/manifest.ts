import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?app",
    name: "RnB — Komunitas Rise Never Break",
    short_name: "RnB",
    description:
      "Feed, forum, stories, pesan, pasar & wiki komunitas RnB. Login pakai Discord.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0b",
    theme_color: "#5865F2",
    categories: ["social", "communication"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Feed", url: "/feed" },
      { name: "Pesan", url: "/messages" },
      { name: "Forum", url: "/forum" },
      { name: "Notifikasi", url: "/notifications" },
    ],
  };
}
