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
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dexcoprod.vteximg.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "deca.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "produtos.deca.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "docolinstitucional.vteximg.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "censi-site-resources.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/assets.tramontina.com.br/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/mercos-images/:path*",
        destination: "https://arquivos.mercos.com/:path*",
      },
      {
        source: "/api/dexco-images/:path*",
        destination: "https://dexcoprod.vteximg.com.br/:path*",
      },
      {
        source: "/api/cloudinary-images/:path*",
        destination: "https://res.cloudinary.com/:path*",
      },
      {
        source: "/api/docol-images/:path*",
        destination: "https://docolinstitucional.vteximg.com.br/:path*",
      },
      {
        source: "/api/censi-images/:path*",
        destination: "https://censi-site-resources.s3.sa-east-1.amazonaws.com/:path*",
      },
      {
        source: "/api/tramontina-images/:path*",
        destination: "https://s3.amazonaws.com/assets.tramontina.com.br/:path*",
      },
    ];
  },
};

export default nextConfig;