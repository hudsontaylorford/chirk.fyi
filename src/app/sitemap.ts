import type { MetadataRoute } from "next";

/** Only the public pages; chirks themselves are private and never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";
  return ["", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
}
