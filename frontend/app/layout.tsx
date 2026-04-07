import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { AuthProvider } from '@/contexts/AuthContext';
import { TutorialProvider } from '@/components/TutorialProvider';
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"

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
        <Analytics />
        <body className="antialiased min-h-screen bg-muted flex flex-col">
          <TutorialProvider>
            <Header />
            <main className="flex-1 flex flex-col bg-muted">
              {children}
            </main>
            <Toaster />
          </TutorialProvider>
        </body>
      </html>
    </AuthProvider>
  );
}

