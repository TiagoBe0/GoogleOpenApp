import type { NextConfig } from "next";

// This project lives nested inside another repo that also has a lockfile, so
// Next/Turbopack would otherwise infer the wrong workspace root. Pin it to this
// directory to keep dev + build file tracing scoped to the app.
const projectRoot = import.meta.dirname;

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  allowedDevOrigins: ["192.168.100.8"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
