/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    // Default is 10MB. Larger reel videos never finish parsing and the UI stays on "Uploading...".
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
