import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // URLs publiques Supabase Storage (bucket portfolio-media).
      { protocol: "https", hostname: "*.supabase.co" },
      // Images de démonstration (mode démo).
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
