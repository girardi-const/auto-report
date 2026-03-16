import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "arquivos.mercos.com",
        pathname: "/**"
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/mercos-images/:path*',
        destination: 'https://arquivos.mercos.com/:path*',
      },
    ];
  },
};

export default nextConfig;
