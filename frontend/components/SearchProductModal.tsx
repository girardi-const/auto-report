"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, PackageSearch, ImageOff, Tag, ChevronRight, Plus, Package } from "lucide-react";
import Image from "next/image";
import { CatalogProduct, CartItem } from "../types";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { getProxyImageUrl } from "@/utils/image";

interface SearchProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (product: CatalogProduct) => void; // for single selection
    onConfirm?: (items: CartItem[]) => void; // for multi selection
    multiSelect?: boolean; // flag to enable multi-select mode
}

interface Brand {
    _id: string;
    brand_name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function SearchProductModal({ isOpen, onClose, onSelect, onConfirm, multiSelect }: SearchProductModalProps) {
    const { getIdToken } = useAuth();
    const [query, setQuery] = useState("");
    const [activeBrand, setActiveBrand] = useState<string | null>(null);
    const [results, setResults] = useState<CatalogProduct[]>([]);
    // State for multi-select mode
    const [selectedItems, setSelectedItems] = useState<Record<string, { product: CatalogProduct; quantity: number }>>({});
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
        if (multiSelect) {
            // Add or increment in selected items
            setSelectedItems((prev) => {
                const existing = prev[product._id];
                const quantity = existing ? existing.quantity + 1 : 1;
                return { ...prev, [product._id]: { product, quantity } };
            });
        } else {
            onSelect?.(product);
            onClose();
        }
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
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden flex ${multiSelect ? 'flex-row' : 'flex-col'}`}
                style={{ maxHeight: "88vh", animation: "modalSlideIn 0.18s cubic-bezier(0.22,1,0.36,1)" }}
            >
                {/* Main Content Area */}
                <div className={`flex flex-col ${multiSelect ? 'flex-1' : 'w-full'}`}>
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
                            className="w-full pl-12 pr-10 py-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:bg-white bg-gray-50 outline-none text-base font-medium text-gray-700 placeholder:text-gray-300 transition-all shadow-sm"
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
                                    <div key={product._id} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm transition-all text-left group">
                                        {/* Thumbnail */}
                                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                            {product.imageurl ? (
                                                <Image
                                                    src={getProxyImageUrl(product.imageurl) || "/placeholder.webp"}
                                                    alt={product.description}
                                                    width={44}
                                                    height={44}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
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
                                                    <span className="ml-2 text-gray-300 font-bold">#{product.product_code}</span>
                                                )}
                                            </p>
                                            <p className="text-xs font-semibold text-gray-700 leading-snug break-words whitespace-normal line-clamp-2">
                                                {product.description || "(sem descrição)"}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div className="w-24 flex-shrink-0 text-right flex flex-col items-end gap-1">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">Preço base</p>
                                            <p className="text-sm font-black text-secondary whitespace-nowrap">{formatCurrency(product.base_price)}</p>
                                        </div>

                                        {/* Action */}
                                        <div className="w-10 flex-shrink-0 flex items-center justify-center">
                                            {multiSelect ? (
                                                <button
                                                    onClick={() => handleSelect(product)}
                                                    className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:rotate-90 active:scale-90 shadow-sm"
                                                >
                                                    <Plus size={16} strokeWidth={3} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSelect(product)}
                                                    className="text-gray-200 group-hover:text-primary transition-colors p-1"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
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
                                                    <span className="text-gray-300 font-bold normal-case tracking-normal">({total - results.length} restantes)</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Sidebar for Multi-Select */}
                {multiSelect && (
                    <div className="w-96 bg-white border-l border-gray-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] animate-in slide-in-from-right-4 duration-300">
                        <div className="p-5 border-b border-gray-50 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                <Package size={16} />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Produtos Selecionados</h3>
                            <span className="ml-auto bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                                {Object.values(selectedItems).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {Object.values(selectedItems).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 opacity-60">
                                    <Plus size={24} strokeWidth={1} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Vazio</p>
                                </div>
                            ) : (
                                Object.values(selectedItems).map(({ product, quantity }) => (
                                    <div key={product._id} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 hover:border-primary/20 transition-all group">
                                        <div className="flex gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-white flex-shrink-0">
                                                {product.imageurl ? (
                                                    <Image
                                                        src={getProxyImageUrl(product.imageurl) || "/placeholder.webp"}
                                                        alt={product.description}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                        <ImageOff size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="text-[11px] font-bold text-gray-700 leading-tight line-clamp-2 break-words whitespace-normal">
                                                        {product.description}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedItems(prev => {
                                                            const next = { ...prev };
                                                            delete next[product._id];
                                                            return next;
                                                        })}
                                                        className="text-gray-300 hover:text-red-400 p-0.5 transition-colors flex-shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-0.5 shadow-sm">
                                                <button
                                                    onClick={() => setSelectedItems((prev) => ({
                                                        ...prev,
                                                        [product._id]: { product, quantity: Math.max(1, quantity - 1) }
                                                    }))}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-50 text-gray-400 active:scale-95 transition-all font-bold"
                                                >-</button>
                                                <span className="w-6 text-center text-[11px] font-black text-secondary">{quantity}</span>
                                                <button
                                                    onClick={() => setSelectedItems((prev) => ({
                                                        ...prev,
                                                        [product._id]: { product, quantity: quantity + 1 }
                                                    }))}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-50 text-gray-400 active:scale-95 transition-all font-bold"
                                                >+</button>
                                            </div>
                                            <span className="text-xs font-black text-secondary">
                                                {formatCurrency(product.base_price * quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-100 mt-auto">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Estimado</span>
                                <span className="text-base font-black text-secondary">
                                    {formatCurrency(Object.values(selectedItems).reduce((acc, { product, quantity }) => acc + (product.base_price * quantity), 0))}
                                </span>
                            </div>
                            <button
                                disabled={Object.values(selectedItems).length === 0}
                                onClick={() => { onConfirm?.(Object.values(selectedItems)); onClose(); }}
                                className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                            >
                                Confirmar Seleção
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
