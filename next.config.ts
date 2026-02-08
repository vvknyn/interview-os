import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure worker is resolved via Node
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
