import type { MetadataRoute } from "next";

/** Komunitas tertutup — jangan di-crawl. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
