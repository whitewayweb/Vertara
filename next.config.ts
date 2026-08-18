import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows the local desktop preview host to receive Next.js development HMR updates.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
