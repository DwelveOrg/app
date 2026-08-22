import type { NextConfig } from "next";

import { SITE_URL } from "./src/lib/seo";

/**
 * Baseline security response headers applied to every route. These defend
 * against clickjacking, MIME-sniffing, referrer leakage, and abuse of powerful
 * browser features. HSTS is honored only over HTTPS (ignored on plain HTTP dev),
 * so it is safe to send everywhere.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const canonicalRedirectHosts = ["www.dwelve.uz", "dwelve.vercel.app"] as const;

const nextConfig: NextConfig = {
  // Never expose the framework fingerprint in the `X-Powered-By` header.
  poweredByHeader: false,
  // No remote image hosts. The auth panels used to hotlink Unsplash; their visuals are now
  // rendered from design tokens, so nothing outside this origin is loaded.
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return canonicalRedirectHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${SITE_URL}/:path*`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
