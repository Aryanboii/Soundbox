/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" }, // Spotify album art CDN
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "*.public-images.prod.airsplay.dev" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
