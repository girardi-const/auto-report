import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/proxy-image",
        search: "?url=**",
      },
    ],
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
        hostname: "**.deca.com.br",
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
        hostname: "**.rinnai.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.vnda.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.komeco.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.siermoveis.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.lorenzetti.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.balcony.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.incepa.com.br",
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
        hostname: "**.stella.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.nordecor.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.senseceramica.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.gabcer.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.avantlux.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.rocaceramica.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.eliane.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "meucentury.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pixiluminacao.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "skylightiluminacao.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "madelustre.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "jlriluminacao.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.grupoembramaco.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets-us-01.kc-usercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lojabella.vtexassets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tinsultintas.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3-sa-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "download-warehouse.sketchup.com",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'ledart.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blumenauiluminacao.com.br',
        pathname: '/**',
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
      {
        source: "/api/ledart-images/:path*",
        destination: "https://ledart.com.br/:path*",
      },
      {
        source: "/api/blumenau-images/:path*",
        destination: "https://blumenauiluminacao.com.br/:path*",
      }
    ];
  },
};

export default nextConfig;