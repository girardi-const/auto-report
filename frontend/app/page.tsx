'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FileText, Database, History, UserPlus, PackagePlus, UploadCloud } from "lucide-react";

export default function Home() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white">
        <div className="text-gray-500 font-medium italic">Carregando portal...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const cards = [
    {
      href: "/gerar-relatorio",
      title: "Gerar Relatório",
      description: "Crie relatórios com imagens, orçamentos e detalhes personalizados.",
      icon: FileText,
      glowColor: "var(--color-primary)",
      delay: "0s"
    },
    {
      href: "/products",
      title: "Catálogo",
      description: "Navegue pelo catálogo completo de produtos e adicione-os ao seu relatório.",
      icon: Database,
      glowColor: "#3b82f6", // blue-500
      delay: "-1s"
    },
    {
      href: "/reports",
      title: "Histórico",
      description: "Acesse e gerencie seus relatórios salvos anteriormente.",
      icon: History,
      glowColor: "#22c55e", // green-500
      delay: "-2s"
    }
  ];

  if (isAdmin) {
    cards.push({
      href: "/create-product",
      title: "Produtos",
      description: "Cadastre novos produtos no sistema como administrador.",
      icon: PackagePlus,
      glowColor: "#a855f7", // purple-500
      delay: "-3s"
    });
    cards.push({
      href: "/users",
      title: "Usuários",
      description: "Gerencie o acesso e permissões de usuários do sistema.",
      icon: UserPlus,
      glowColor: "#f59e0b", // amber-500
      delay: "-4s"
    });
    cards.push({
      href: "/admin/importar",
      title: "Importador",
      description: "Faça upload de planilhas para cadastrar múltiplos produtos de uma vez.",
      icon: UploadCloud,
      glowColor: "#ef4444", // red-500
      delay: "-5s"
    });
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-white to-gray-50 w-full flex flex-col pt-16 px-4 md:px-8 text-secondary relative overflow-hidden flex-grow -mt-4">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgyMCIgc3Ryb2tlPSIjMDAwMDAwMDMiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMSAxVjIwIiBzdHJva2U9IiMwMDAwMDAwMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] opacity-40 z-0"></div>

      <div className="container mx-auto max-w-6xl z-10">
        <div className="mb-16 max-w-2xl animate-in slide-in-from-bottom-8 duration-700 fade-in">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-secondary">
            Portal <span className="text-primary italic">Girardi</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Selecione uma ferramenta abaixo para continuar. Acesse o catálogo, crie novos orçamentos, ou gerencie o sistema com rapidez.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {cards.map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              className="group block focus:outline-none h-full animate-in slide-in-from-bottom-12 fade-in fill-mode-both"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div
                className="glow-card-wrapper h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                style={{
                  "--glow-color": card.glowColor,
                  "--animation-delay": card.delay
                } as React.CSSProperties}
              >
                <div className="glow-card-content p-8 flex flex-col h-full border border-gray-100 rounded-[calc(var(--radius-xl)-2px)] relative overflow-hidden transition-colors duration-300 bg-white group-hover:bg-gray-50">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[calc(var(--radius-xl)-2px)]"></div>

                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${card.glowColor}15`, color: card.glowColor, border: `1px solid ${card.glowColor}30` }}>
                    <card.icon size={26} strokeWidth={2.5} />
                  </div>

                  <h2 className="text-2xl font-black mb-3 relative z-10 text-secondary tracking-tight group-hover:text-primary transition-all duration-300">{card.title}</h2>
                  <p className="text-gray-500 text-sm flex-1 leading-relaxed relative z-10 font-medium group-hover:text-gray-700 transition-colors">
                    {card.description}
                  </p>

                  <div className="mt-8 flex items-center text-xs font-black tracking-widest uppercase relative z-10 transition-colors duration-300" style={{ color: card.glowColor }}>
                    Acessar <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300 font-bold">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
