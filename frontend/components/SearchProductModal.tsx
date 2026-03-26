"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, PackageSearch, ImageOff, Tag, ChevronRight } from "lucide-react";
import Image from "next/image";
import { CatalogProduct } from "../types";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "@/contexts/AuthContext";

interface SearchProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: CatalogProduct) => void;
}

interface Brand {
    _id: string;
    brand_name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function SearchProductModal({ isOpen, onClose, onSelect }: SearchProductModalProps) {
    const { getIdToken } = useAuth();
    const [query, setQuery] = useState("");
    const [activeBrand, setActiveBrand] = useState<string | null>(null);
    const [results, setResults] = useState<CatalogProduct[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Keep a stable ref to the current query/brand for loadMore
    const lastQueryRef = useRef<{ term: string; brand: string | null }>({ term: "", brand: null });

    // Load brands once on mount
    useEffect(() => {
        (async () => {
            try {
                const token = await getIdToken();
                const res = await fetch(`${API_URL}/brands`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                const list: Brand[] = Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : [];
                setBrands(list);
            } catch {
                /* ignore */
            }
        })();
    }, [getIdToken]);

    // Focus input when modal opens / reset state
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setResults([]);
            setHasSearched(false);
            setActiveBrand(null);
            setTotal(0);
            setPage(1);
            lastQueryRef.current = { term: "", brand: null };
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

    const fetchPage = useCallback(
        async (term: string, brand: string | null, targetPage: number, append: boolean) => {
            const trimmed = term.trim();
            const hasTerm = trimmed.length >= 1;
            const hasBrand = !!brand;

            if (!hasTerm && !hasBrand) {
                setResults([]);
                setHasSearched(false);
                setTotal(0);
                return;
            }

            try {
                if (append) setIsLoadingMore(true);
                else setIsLoading(true);

                const token = await getIdToken();
                const params = new URLSearchParams({
                    sortBy: "updatedAt",
                    sortOrder: "desc",
                    page: String(targetPage),
                    limit: "20",
                });
                if (trimmed) params.set("search", trimmed);
                if (brand) params.set("brand", brand);

                const res = await fetch(`${API_URL}/products?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Erro na busca");
                const data = await res.json();

                const list: CatalogProduct[] = Array.isArray(data?.data?.data)
                    ? data.data.data
                    : [];
                const count: number = data?.data?.total ?? list.length;

                setResults((prev) => append ? [...prev, ...list] : list);
                setTotal(count);
                setPage(targetPage);
                setHasSearched(true);
            } catch {
                if (!append) {
                    setResults([]);
                    setTotal(0);
                    setHasSearched(true);
                }
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [getIdToken]
    );

    const search = useCallback(
        (term: string, brand: string | null) => {
            lastQueryRef.current = { term, brand };
            setPage(1);
            fetchPage(term, brand, 1, false);
        },
        [fetchPage]
    );

    const loadMore = () => {
        const nextPage = page + 1;
        fetchPage(lastQueryRef.current.term, lastQueryRef.current.brand, nextPage, true);
    };

    // Trigger search whenever query or brand changes
    const triggerSearch = (term: string, brand: string | null) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(term, brand), 250);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        triggerSearch(val, activeBrand);
    };

    const handleBrandClick = (brandName: string) => {
        const next = activeBrand === brandName ? null : brandName;
        setActiveBrand(next);
        triggerSearch(query, next);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        setActiveBrand(null);
        setTotal(0);
        setPage(1);
        lastQueryRef.current = { term: "", brand: null };
        inputRef.current?.focus();
    };

    const handleSelect = (product: CatalogProduct) => {
        onSelect(product);
        onClose();
    };

    // Brands to highlight: if query matches a brand name, surface it first
    const sortedBrands = [...brands].sort((a, b) => {
        const q = query.toLowerCase();
        const aMatch = q && a.brand_name.toLowerCase().includes(q);
        const bMatch = q && b.brand_name.toLowerCase().includes(q);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return a.brand_name.localeCompare(b.brand_name);
    });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh] bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden flex flex-col"
                style={{ maxHeight: "88vh", animation: "modalSlideIn 0.18s cubic-bezier(0.22,1,0.36,1)" }}
            >
                {/* ── Header ── */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <PackageSearch size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                            Buscar Produto
                        </h2>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            Pesquise pelo nome, código ou marca — busca inteligente por palavras-chave
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Search Input ── */}
                <div className="relative mx-5 mt-4 flex-shrink-0">
                    <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleChange}
                        placeholder="Ex: rainbow piso, chuveiro, DECA..."
                        className="w-full pl-10 pr-9 py-3 rounded-xl border-2 border-gray-100 focus:border-primary focus:bg-white bg-gray-50 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300 transition-all"
                    />
                    {isLoading && (
                        <Loader2
                            size={14}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-primary"
                        />
                    )}
                    {!isLoading && (query || activeBrand) && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* ── Brand Filter Chips ── */}
                {sortedBrands.length > 0 && (
                    <div className="mx-5 mt-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Tag size={10} className="text-gray-300" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                                Filtrar por marca
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                            {sortedBrands.map((b) => {
                                const isActive = activeBrand === b.brand_name;
                                const isHighlighted = !isActive && query && b.brand_name.toLowerCase().includes(query.toLowerCase());
                                return (
                                    <button
                                        key={b._id}
                                        onClick={() => handleBrandClick(b.brand_name)}
                                        className={`
                                            px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border
                                            ${isActive
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : isHighlighted
                                                    ? "bg-primary/10 text-primary border-primary/30"
                                                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600"
                                            }
                                        `}
                                    >
                                        {b.brand_name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Results header ── */}
                {hasSearched && !isLoading && (
                    <div className="mx-5 mt-3 flex items-center justify-between flex-shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                            {results.length === 0
                                ? "Nenhum resultado"
                                : total > results.length
                                    ? `${results.length} de ${total} resultados`
                                    : `${results.length} resultado${results.length !== 1 ? "s" : ""}`}
                        </span>
                        {activeBrand && (
                            <button
                                onClick={() => { setActiveBrand(null); triggerSearch(query, null); }}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                            >
                                <X size={9} /> Limpar marca
                            </button>
                        )}
                    </div>
                )}

                {/* ── Results List ── */}
                <div className="mt-2 mb-4 mx-5 flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 min-h-[120px]">
                    {!hasSearched && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-3">
                            <Search size={32} strokeWidth={1.5} />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
                                Digite para pesquisar
                            </p>
                            <p className="text-[10px] text-gray-200 font-medium px-8 text-center">
                                Ou selecione uma marca acima para ver todos os produtos
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 size={28} className="animate-spin text-primary/40" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
                                Buscando...
                            </p>
                        </div>
                    )}

                    {!isLoading && hasSearched && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <PackageSearch size={32} strokeWidth={1.5} className="text-gray-200" />
                            <div className="text-center px-6">
                                <p className="text-[12px] font-black text-gray-400 uppercase tracking-wider">
                                    Nenhum produto encontrado
                                </p>
                                <p className="text-[10px] text-gray-300 mt-1 font-medium">
                                    Tente palavras diferentes ou remova filtros de marca
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

                                    {/* Price + arrow */}
                                    <div className="flex-shrink-0 text-right flex items-center gap-1.5">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                Preço base
                                            </p>
                                            <p className="text-sm font-black text-secondary">
                                                {formatCurrency(product.base_price)}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-200 group-hover:text-primary/40 transition-colors" />
                                    </div>
                                </button>
                            ))}

                            {/* ── Mostrar mais ── */}
                            {results.length < total && (
                                <div className="flex items-center justify-center py-3 border-t border-gray-100">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-primary border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                Carregando...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronRight size={12} className="rotate-90" />
                                                Mostrar mais
                                                <span className="text-gray-300 font-bold normal-case tracking-normal">
                                                    ({total - results.length} restantes)
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
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
