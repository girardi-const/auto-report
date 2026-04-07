"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useMongoUser } from "@/hooks/useMongoUser";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Header() {
    const { user, signOut, isAdmin } = useAuth();
    const { mongoUser } = useMongoUser();
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

                {/* User Dropdown */}
                {user && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full pl-3 pr-3 py-1.5 border border-white/10 transition-colors"
                        >
                            <div className="bg-primary/20 p-1.5 rounded-full text-primary">
                                <UserIcon size={16} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-white text-sm font-semibold leading-tight">
                                    {mongoUser?.name || 'Carregando...'}
                                </span>
                                <span className="text-white/50 text-[10px] uppercase tracking-wider font-bold">
                                    {isAdmin ? 'Administrador' : 'Usuário'}
                                </span>
                            </div>
                            <ChevronDown
                                size={14}
                                className={`text-white/40 ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-[#2e2c2b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                {/* User Info Row */}
                                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                                    <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
                                        <UserIcon size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm font-semibold truncate">
                                            {mongoUser?.name || 'Carregando...'}
                                        </span>
                                        <span className="text-white/40 text-xs truncate">
                                            {user.email}
                                        </span>
                                        <span className="text-white/40 text-xs truncate">
                                            {mongoUser?.telephone}
                                        </span>
                                        <span className="text-white text-[10px] uppercase tracking-widest font-bold mt-0.5">
                                            {isAdmin ? 'Administrador' : 'Usuário'}
                                        </span>
                                    </div>
                                </div>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium"
                                >
                                    <LogOut size={15} className="text-primary" />
                                    Sair do sistema
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Bar */}
            {pathname !== "/" && !pathname.startsWith("/sign-in") && (
                <nav className="bg-[#403e3d] border-t border-white/5 py-3 px-4 md:px-8">
                    <ul className="flex flex-wrap justify-center gap-8 text-white text-sm font-medium">
                        <li>
                            <Link href="/gerar-relatorio" className="hover:text-primary transition-colors">
                                Gerar Relatório
                            </Link>
                        </li>
                        <li>
                            <Link href="/editor" className="hover:text-primary transition-colors">
                                Editor Livre
                            </Link>
                        </li>
                        {isAdmin && (
                            <>
                                <li>
                                    <Link href="/criar-produto" className="hover:text-primary transition-colors">
                                        Criar Produto
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/usuarios" className="hover:text-primary transition-colors">
                                        Usuários
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin/importar" className="hover:text-primary transition-colors">
                                        Importar
                                    </Link>
                                </li>
                            </>
                        )}
                        <li>
                            <Link href="/marcas" className="hover:text-primary transition-colors">
                                Marcas
                            </Link>
                        </li>
                        <li>
                            <Link href="/catalogo" className="hover:text-primary transition-colors">
                                Catálogo
                            </Link>
                        </li>
                        <li>
                            <Link href="/historico" className="hover:text-primary transition-colors">
                                Histórico
                            </Link>
                        </li>
                        <li>
                            <Link href="/suporte" className="hover:text-primary transition-colors">
                                Suporte
                            </Link>
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    );
}