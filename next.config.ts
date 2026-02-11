import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  turbopack: {
    // Fix for iCloud Drive - set explicit root
    root: process.cwd(),
  },
};

export default nextConfig;
