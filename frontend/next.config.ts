import type { NextConfig } from "next";
import path from "node:path";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next"
};
export default nextConfig;
