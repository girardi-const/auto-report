"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function Header() {
    const { user, signOut, isAdmin } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <header className="w-full font-sans">
            {/* Main Bar */}
            <div className="bg-[#403e3d] border-t border-white/10 px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <img
                        src="https://girardionline.cdn.magazord.com.br/resources/logo4.svg"
                        alt="Girardi Casa & Construção"
                        className="h-14 w-auto"
                    />
                </Link>

                {/* User Info & Sign Out */}
                {user && (
                    <div className="flex items-center gap-4">
                        <span className="text-white/80 text-sm">
                            {user.email}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-[#c91e25] text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Bar */}
            <nav className="bg-[#403e3d] border-t border-white/5 py-3 px-4 md:px-8">
                <ul className="flex flex-wrap justify-center gap-8 text-white text-sm font-medium">
                    <li>
                        <Link href="/" className="hover:text-primary transition-colors">
                            Gerar Relatório
                        </Link>
                    </li>
                    {
                        isAdmin && (
                            <>
                                <li>
                                    <Link href="/create-product" className="hover:text-primary transition-colors">
                                        Produtos
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/users" className="hover:text-primary transition-colors">
                                        Usuários
                                    </Link>
                                </li>
                            </>
                        )
                    }
                    <li>
                        <Link href="/products" className="hover:text-primary transition-colors">
                            Catálogo
                        </Link>
                    </li>
                    <li>
                        <Link href="/reports" className="hover:text-primary transition-colors">
                            Histórico
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
