import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos are shrunk on the phone to a ~1600px JPEG (a few hundred KB) before upload; 2 MB leaves room.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
