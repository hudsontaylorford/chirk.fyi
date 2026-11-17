import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos are shrunk on the phone before upload; import screenshots and PDFs can be up to 4 MB (Vercel caps requests at 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
};

export default nextConfig;
