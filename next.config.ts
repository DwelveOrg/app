import type { NextConfig } from "next";

import { SITE_URL } from "./src/lib/seo";

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: https:${isDevelopment ? " http://localhost:*" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' https://accounts.google.com${isDevelopment ? " ws: http:" : ""}`,
  "frame-src https://accounts.google.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/**
 * Baseline security response headers applied to every route. These defend
 * against clickjacking, MIME-sniffing, referrer leakage, and abuse of powerful
 * browser features. HSTS is honored only over HTTPS (ignored on plain HTTP dev),
 * so it is safe to send everywhere.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
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

/**
 * Compatibility redirects for the retired Settings routes. Profile and Settings
 * are one account area now (`/profile`), so every old entry point lands on the
 * tab its content moved to.
 *
 * These live in the config rather than as `redirect()` page stubs so the hop
 * happens before anything renders, and they cannot loop: no destination is a
 * source. They stay `permanent: false` deliberately — a 308 is cached by the
 * browser indefinitely, which would strand `/settings` if the route ever comes
 * back, and the product has no released links to these URLs to save a hop for.
 *
 * Config redirects run before the proxy, so an unauthenticated request to an old
 * URL lands on `/profile` first and is bounced to `/login` from there — the auth
 * check still happens, one hop later than it would for a direct `/profile` hit.
 */
const settingsRedirects = [
  { source: "/settings", destination: "/profile" },
  { source: "/settings/change-password", destination: "/profile?tab=security" },
  { source: "/settings/sessions", destination: "/profile?tab=security" },
  { source: "/settings/documentation", destination: "/profile?tab=support" },
  // Never shipped as a page, but it was a declared route label; send it somewhere real.
  { source: "/settings/login-history", destination: "/profile?tab=security" },
];

const nextConfig: NextConfig = {
  // Never expose the framework fingerprint in the `X-Powered-By` header.
  poweredByHeader: false,
  // Report screenshots and PDF imports pass through Server Actions before
  // reaching Nest. Next otherwise rejects them above its 1 MB default before
  // the feature-level validation can run. The extra megabyte covers the
  // multipart envelope around the largest supported PDF (20 MB).
  experimental: {
    serverActions: {
      bodySizeLimit: "21mb",
    },
  },
  // No remote image hosts. The auth panels used to hotlink Unsplash; their visuals are now
  // rendered from design tokens, so nothing outside this origin is loaded.
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      ...canonicalRedirectHosts.map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: `${SITE_URL}/:path*`,
        permanent: true,
      })),
      ...settingsRedirects.map((redirect) => ({ ...redirect, permanent: false })),
    ];
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
