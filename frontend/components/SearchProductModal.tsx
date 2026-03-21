"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, PackageSearch, Info, ImageOff } from "lucide-react";
import Image from "next/image";
import { CatalogProduct } from "../types";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "@/contexts/AuthContext";

interface SearchProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: CatalogProduct) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function SearchProductModal({ isOpen, onClose, onSelect }: SearchProductModalProps) {
    const { getIdToken } = useAuth();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CatalogProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setResults([]);
            setHasSearched(false);
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [isOpen, onClose]);

    const search = useCallback(
        async (term: string) => {
            if (!term.trim() || term.trim().length < 2) {
                setResults([]);
                setHasSearched(false);
                return;
            }
            try {
                setIsLoading(true);
                const token = await getIdToken();
                const url = `${API_URL}/products?search=${encodeURIComponent(term.trim())}&limit=18&sortBy=updatedAt&sortOrder=desc`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Erro na busca");
                const data = await res.json();
                // createSuccessResponse wraps in { data: { data: [...], total, page, totalPages } }
                const list: CatalogProduct[] = Array.isArray(data?.data?.data)
                    ? data.data.data
                    : [];
                setResults(list);
                setHasSearched(true);
            } catch {
                setResults([]);
                setHasSearched(true);
            } finally {
                setIsLoading(false);
            }
        },
        [getIdToken]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(val), 400);
    };

    const handleSelect = (product: CatalogProduct) => {
        onSelect(product);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
                style={{ animation: "modalSlideIn 0.18s cubic-bezier(0.22,1,0.36,1)" }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <PackageSearch size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                            Buscar Produto
                        </h2>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            Pesquise pelo nome ou marca do produto
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Info banners */}
                <div className="mx-5 mt-4 flex flex-col gap-2">
                    {/* How it works */}
                    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5">
                        <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                            A busca encontra resultados <strong>similares</strong> pelo nome, descrição ou marca — funciona como uma busca aproximada por texto.
                        </p>
                    </div>
                    {/* Accuracy warning */}
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                        <span className="flex-shrink-0 text-amber-500 text-[13px] mt-px">⚠️</span>
                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                            A busca por nome <strong>não é tão precisa</strong> quanto inserir o código diretamente. Se você conhece o código do produto, prefira digitá-lo na coluna <strong>Código</strong> para garantir o resultado correto.
                        </p>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative mx-5 mt-3">
                    <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleChange}
                        placeholder="Ex: torneira, chuveiro, DECA..."
                        className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-100 focus:border-primary focus:bg-white bg-gray-50 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300 transition-all"
                    />
                    {isLoading && (
                        <Loader2
                            size={14}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-primary"
                        />
                    )}
                    {!isLoading && query && (
                        <button
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                                setHasSearched(false);
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="mt-3 mb-5 mx-5 max-h-[360px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50">
                    {!hasSearched && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-3">
                            <Search size={32} strokeWidth={1.5} />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
                                Digite para pesquisar
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 size={28} className="animate-spin text-primary/40" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
                                Buscando...
                            </p>
                        </div>
                    )}

                    {!isLoading && hasSearched && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <PackageSearch size={32} strokeWidth={1.5} className="text-gray-200" />
                            <div className="text-center">
                                <p className="text-[12px] font-black text-gray-400 uppercase tracking-wider">
                                    Nenhum produto encontrado
                                </p>
                                <p className="text-[10px] text-gray-300 mt-1 font-medium">
                                    Tente um termo diferente ou verifique o código
                                </p>
                            </div>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {results.map((product) => (
                                <button
                                    key={product._id}
                                    onClick={() => handleSelect(product)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm transition-all text-left group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                        {product.imageurl ? (
                                            <Image
                                                src={product.imageurl}
                                                alt={product.description}
                                                width={44}
                                                height={44}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageOff size={16} className="text-gray-300" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-0.5">
                                            {product.brand_name}
                                            {product.product_code && (
                                                <span className="ml-2 text-gray-300 font-bold">
                                                    #{product.product_code}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-700 leading-tight truncate">
                                            {product.description || "(sem descrição)"}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            Preço base
                                        </p>
                                        <p className="text-sm font-black text-secondary">
                                            {formatCurrency(product.base_price)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
            `}</style>
        </div>
    );
}
