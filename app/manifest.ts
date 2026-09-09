import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RnB — Komunitas Rise Never Break",
    short_name: "RnB",
    description: "Forum & feed komunitas RnB",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#5865F2",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
