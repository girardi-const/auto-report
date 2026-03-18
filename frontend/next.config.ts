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
      },
      {
        protocol: "https",
        hostname: "dexcoprod.vteximg.com.br",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "deca.com.br",
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
      {
        source: '/api/dexco-images/:path*',
        destination: 'https://dexcoprod.vteximg.com.br/:path*',
      },
      {
        source: '/api/cloudinary-images/:path*',
        destination: 'https://res.cloudinary.com/:path*',
      },
    ];
  },
};

export default nextConfig;
