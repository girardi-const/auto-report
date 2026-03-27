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
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.tramontina.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.rinnai.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.vnda.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.komeco.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "siermoveis.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "siermoveis.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.lorenzetti.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.lorenzetti.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lorenzetti.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "lorenzetti.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.balcony.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.balcony.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.incepa.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.incepa.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn3.quick-step.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "docolinstitucional.vtexassets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "stella.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nordecor.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.senseceramica.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.senseceramica.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "senseceramica.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "senseceramica.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gabcer.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "gabcer.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gabcer.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.gabcer.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avantlux.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "avantlux.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.avantlux.com.br",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.avantlux.com.br",
        pathname: "/**",
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
      {
        source: "/api/rinnai-images/:path*",
        destination: "https://www.rinnai.com.br/:path*",
      },
      {
        source: "/api/immersi-images/:path*",
        destination: "https://cdn.vnda.com.br/:path*",
      },
      {
        source: "/api/komeco-images/:path*",
        destination: "https://www.komeco.com.br/:path*",
      },
      {
        source: "/api/sier-images/:path*",
        destination: "https://siermoveis.com.br/:path*",
      },
      {
        source: "/api/lorenzetti-images/:path*",
        destination: "https://www.lorenzetti.com.br/:path*",
      },
      {
        source: "/api/lorenzetti2-images/:path*",
        destination: "https://lorenzetti.com.br/:path*",
      },
      {
        source: "/api/balcony-images/:path*",
        destination: "https://www.balcony.com.br/:path*",
      },
      {
        source: "/api/incepa-images/:path*",
        destination: "https://www.incepa.com.br/:path*",
      },
      {
        source: "/api/quickstep-images/:path*",
        destination: "https://cdn3.quick-step.com/:path*",
      },
      {
        source: "/api/stella-images/:path*",
        destination: "https://stella.com.br/:path*",
      },
      {
        source: "/api/nordecor-images/:path*",
        destination: "https://nordecor.com.br/:path*",
      },
      {
        source: "/api/sense-images/:path*",
        destination: "https://www.senseceramica.com.br/:path*",
      },
      {
        source: "/api/sense2-images/:path*",
        destination: "https://senseceramica.com.br/:path*",
      },
      {
        source: "/api/gabcer-images/:path*",
        destination: "https://gabcer.com.br/:path*",
      },
      {
        source: "/api/gabcer2-images/:path*",
        destination: "https://www.gabcer.com.br/:path*",
      },
      {
        source: "/api/avant-images/:path*",
        destination: "https://avantlux.com.br/:path*",
      },
      {
        source: "/api/avant2-images/:path*",
        destination: "https://www.avantlux.com.br/:path*",
      },
    ];
  },
};

export default nextConfig;