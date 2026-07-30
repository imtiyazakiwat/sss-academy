import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home directory otherwise
  // makes Turbopack infer the wrong root.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  images: {
    // Staff/team photos use unoptimized external URLs rather than proxying
    // through Next.js image optimization — keeps the image proxy locked down.
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // firebase-admin is server-only and pulls in native-ish deps; keep it external
  // so it is required at runtime rather than bundled.
  serverExternalPackages: ["firebase-admin"],

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://firebasestorage.googleapis.com; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },

  async redirects() {
    // Preserve link equity from the PHP URLs that are already indexed.
    return [
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/about.php", destination: "/about", permanent: true },
      { source: "/courses.php", destination: "/courses", permanent: true },
      { source: "/contact.php", destination: "/contact", permanent: true },
      {
        source: "/testimonials.php",
        destination: "/placements",
        permanent: true,
      },
      { source: "/testimonials", destination: "/placements", permanent: true },
    ];
  },
};

export default nextConfig;
