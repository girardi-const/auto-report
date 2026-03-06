import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: "Girardi - Sistema de Relatórios",
  description: "Gerador de relatórios de vendas especializado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="pt-BR">
        <body className="antialiased min-h-screen bg-muted flex flex-col">
          <Header />
          <main className="flex-1 flex flex-col pb-20 bg-muted">
            {children}
          </main>
        </body>
      </html>
    </AuthProvider>
  );
}

