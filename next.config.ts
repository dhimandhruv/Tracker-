import type { NextConfig } from "next";

/**
 * Baseline security headers, applied to every response.
 *
 * The app has no third-party embeds and no cross-origin needs, so these can all
 * be set to their strictest useful values.
 */
const securityHeaders = [
  // Stop the browser guessing a response's type, which is what makes some
  // "upload a .txt, get it served as HTML" attacks work.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Send the full referrer within our own origin, but only the bare origin to
  // third parties, so tracker URLs never leak outward.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here is meant to be framed, so refuse it outright. Blocks the
  // clickjacking trick of overlaying an invisible frame of a signed-in page.
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
