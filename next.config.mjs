/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep HTML pages fresh: browsers always revalidate, the CDN holds a short
  // copy. Prevents stale pages lingering after a deploy. Hashed assets under
  // /_next/static keep their own long-lived immutable caching (untouched here).
  async headers() {
    const htmlCache =
      "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
    return [
      { source: "/", headers: [{ key: "Cache-Control", value: htmlCache }] },
      {
        source: "/showcase",
        headers: [{ key: "Cache-Control", value: htmlCache }],
      },
    ];
  },
};

export default nextConfig;
