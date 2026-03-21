"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16 overflow-hidden relative">
      {/* Background floating shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-shape"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${6 + i * 1.5}s`,
              width: `${30 + i * 12}px`,
              height: `${30 + i * 12}px`,
            }}
          />
        ))}
      </div>

      <div
        className={`relative z-10 text-center max-w-lg transition-all duration-1000 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* SVG Art — Broken document illustration */}
        <div className="mb-8 flex justify-center">
          <svg
            width="260"
            height="220"
            viewBox="0 0 260 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Shadow */}
            <ellipse cx="130" cy="210" rx="80" ry="8" fill="#e0e0e0" className="animate-pulse" />

            {/* Back page */}
            <rect x="70" y="22" width="120" height="160" rx="8" fill="#e8e8e8" stroke="#d0d0d0" strokeWidth="1.5" />
            <line x1="88" y1="50" x2="172" y2="50" stroke="#d0d0d0" strokeWidth="6" strokeLinecap="round" />
            <line x1="88" y1="66" x2="155" y2="66" stroke="#d0d0d0" strokeWidth="6" strokeLinecap="round" />
            <line x1="88" y1="82" x2="165" y2="82" stroke="#d0d0d0" strokeWidth="6" strokeLinecap="round" />

            {/* Front page — torn / shifted */}
            <g className="torn-page">
              <rect x="58" y="30" width="120" height="160" rx="8" fill="white" stroke="#c0c0c0" strokeWidth="1.5" />
              {/* Content lines */}
              <line x1="76" y1="58" x2="140" y2="58" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" />
              <line x1="76" y1="74" x2="158" y2="74" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" />
              <line x1="76" y1="90" x2="148" y2="90" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" />
              <line x1="76" y1="106" x2="130" y2="106" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" />

              {/* Tear / crack line */}
              <path
                d="M 58 120 L 85 115 L 95 128 L 115 112 L 135 125 L 155 118 L 178 120"
                stroke="#c91e25"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="crack-line"
              />

              {/* Bottom half — shifted */}
              <rect x="60" y="122" width="116" height="68" rx="0 0 8 8" fill="white" stroke="#c0c0c0" strokeWidth="1.5" opacity="0.6" className="bottom-half" />
              <line x1="78" y1="140" x2="155" y2="140" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              <line x1="78" y1="156" x2="138" y2="156" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              <line x1="78" y1="172" x2="148" y2="172" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
            </g>

            {/* Magnifying glass — hovering over the document */}
            <g className="magnifying-glass">
              <circle cx="185" cy="65" r="28" fill="white" fillOpacity="0.3" stroke="#c91e25" strokeWidth="3.5" />
              <circle cx="185" cy="65" r="22" fill="white" fillOpacity="0.15" stroke="#c91e2540" strokeWidth="1" />
              <line x1="205" y1="86" x2="222" y2="103" stroke="#c91e25" strokeWidth="5" strokeLinecap="round" />
              {/* Question mark inside */}
              <text x="185" y="74" textAnchor="middle" fill="#c91e25" fontSize="28" fontWeight="bold" fontFamily="Inter, sans-serif">?</text>
            </g>

            {/* Floating particles */}
            <circle cx="45" cy="50" r="3" fill="#c91e25" opacity="0.3" className="particle p1" />
            <circle cx="215" cy="40" r="2.5" fill="#c91e25" opacity="0.25" className="particle p2" />
            <circle cx="35" cy="150" r="2" fill="#c91e25" opacity="0.2" className="particle p3" />
            <circle cx="230" cy="160" r="3.5" fill="#c91e25" opacity="0.15" className="particle p4" />
            <circle cx="50" cy="100" r="2" fill="#403e3d" opacity="0.15" className="particle p5" />
            <circle cx="220" cy="110" r="2.5" fill="#403e3d" opacity="0.1" className="particle p6" />
          </svg>
        </div>

        {/* 404 Number */}
        <h1 className="text-8xl font-black tracking-tight mb-2 four-oh-four">
          <span className="text-secondary">4</span>
          <span className="text-primary">0</span>
          <span className="text-secondary">4</span>
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-secondary mb-3">
          Página não encontrada
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm mx-auto">
          A página que você está procurando pode ter sido movida, removida ou
          simplesmente não existe.
        </p>

        {/* Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Voltar ao Início
        </Link>
      </div>

      {/* Scoped styles */}
      <style jsx>{`
        .four-oh-four {
          background: linear-gradient(135deg, #403e3d 0%, #c91e25 50%, #403e3d 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201, 30, 37, 0.06), transparent);
          animation: float-around ease-in-out infinite;
        }

        @keyframes float-around {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-25px) rotate(180deg); opacity: 0.8; }
        }

        .torn-page {
          animation: subtle-sway 6s ease-in-out infinite;
        }

        @keyframes subtle-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-0.5deg) translateX(-1px); }
        }

        .magnifying-glass {
          animation: hover-bob 3s ease-in-out infinite;
        }

        @keyframes hover-bob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }

        .crack-line {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: draw-crack 2s ease-out forwards;
          animation-delay: 0.5s;
        }

        @keyframes draw-crack {
          to { stroke-dashoffset: 0; }
        }

        .bottom-half {
          animation: slip-down 2s ease-out forwards;
          animation-delay: 1.5s;
        }

        @keyframes slip-down {
          to { transform: translateY(4px) translateX(3px) rotate(1deg); }
        }

        .particle {
          animation: float-particle ease-in-out infinite;
        }
        .p1 { animation-duration: 4s; }
        .p2 { animation-duration: 5s; animation-delay: 0.5s; }
        .p3 { animation-duration: 6s; animation-delay: 1s; }
        .p4 { animation-duration: 4.5s; animation-delay: 1.5s; }
        .p5 { animation-duration: 5.5s; animation-delay: 0.3s; }
        .p6 { animation-duration: 4.8s; animation-delay: 0.8s; }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-12px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
