import type { NextConfig } from "next";

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
  // Report screenshots pass through a Server Action before reaching Nest. Next
  // otherwise rejects anything above its 1 MB default before our 8 MB feature
  // limit or backend image validation can run; the extra megabyte covers the
  // multipart envelope and context fields.
  experimental: {
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
  // No remote image hosts. The auth panels used to hotlink Unsplash; their visuals are now
  // rendered from design tokens, so nothing outside this origin is loaded.
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return settingsRedirects.map((redirect) => ({ ...redirect, permanent: false }));
  },
};

export default nextConfig;
