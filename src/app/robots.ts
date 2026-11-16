import type { MetadataRoute } from "next";

// Crawlers may read the site, but every chirk page says "noindex", so only the home page, Privacy and Terms appear in search.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/host", "/api/"] }, sitemap: `${base}/sitemap.xml` };
}
