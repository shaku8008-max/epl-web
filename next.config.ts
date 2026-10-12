import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // "Cache Components" (new in Next.js 16) is deliberately left off. Instead
  // the home page opts into request-time rendering with
  // `export const dynamic = "force-dynamic"` in src/app/page.tsx.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
