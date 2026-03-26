'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useBrands } from '../../hooks/useBrands';
import { CatalogProduct, EditModalProps } from '../../types';
import {
    Search,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    PackageSearch,
    AlertCircle,
    Loader2,
    X,
    Pencil,
    Trash2,
    Save,
} from 'lucide-react';
import { fmt } from '@/utils/formatters';
import { ProductThumb } from '@/components/CatalogoPage/ProductThumb';
import { EditProductModal } from '@/components/CatalogoPage/EditProductModal';
import { DeleteConfirmModal } from '@/components/CatalogoPage/DeleteConfirmModal';
import { ProductsFilters } from '@/components/CatalogoPage/ProductsFilter';
import { ProductRow } from '@/components/CatalogoPage/ProductRow';

const PAGE_SIZE = 50;

// ─── Price Formatter ────────────────────────────────────────────────────────

// ─── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: [64, 200, 120, 96, 80][i] ?? 80 }} />
                </td>
            ))}
        </tr>
    );
}



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
    const { user, loading: authLoading, isAdmin, getIdToken } = useAuth();
    const router = useRouter();

    // ── Search & Filter State
    const [rawSearch, setRawSearch] = useState('');
    const [search, setSearch] = useState('');
    const [brand, setBrand] = useState('');
    const [page, setPage] = useState(1);
    const [imageFilter, setImageFilter] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { products: pageItems, total, totalPages, loading, error, refetch } = useProducts({
        page,
        limit: PAGE_SIZE,
        search,
        brand,
        imageFilter
    });

    const { brands } = useBrands();

    // Modals state
    const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<CatalogProduct | null>(null);

    // ── Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
    }, [user, authLoading, router]);

    const handleImageFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setImageFilter(e.target.value);
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRawSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(val.trim());
            setPage(1);
        }, 250);
    }, []);

    const handleBrandClick = useCallback((brandName: string | null) => {
        setBrand(brandName || '');
        setPage(1);
    }, []);

    const clearFilters = useCallback(() => {
        setRawSearch('');
        setSearch('');
        setBrand('');
        setImageFilter('');
        setPage(1);
    }, []);

    // No longer doing client-side filtering and slicing
    // as it's handled completely by the server API

    const hasFilters = rawSearch !== '' || brand !== '' || imageFilter !== '';
    const colCount = isAdmin ? 5 : 4;

    // ── Auth loading guard
    if (authLoading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-muted">
            {/* Edit & Delete Modals */}
            {editProduct && (
                <EditProductModal
                    product={editProduct}
                    onClose={() => setEditProduct(null)}
                    onSaved={refetch}
                    getIdToken={getIdToken}
                />
            )}
            {deleteProduct && (
                <DeleteConfirmModal
                    product={deleteProduct}
                    onClose={() => setDeleteProduct(null)}
                    onDeleted={refetch}
                    getIdToken={getIdToken}
                />
            )}

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className=" px-6 py-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-gray-800 font-black text-2xl tracking-tight uppercase">
                            Catálogo de Produtos
                        </h1>
                        <p className="text-gray-800/40 text-xs font-medium mt-0.5">
                            {loading
                                ? 'Carregando…'
                                : `${pageItems.length} de ${total} produtos`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                ⚙ Admin
                            </span>
                        )}
                        <button
                            onClick={refetch}
                            disabled={loading}
                            title="Atualizar lista"
                            className="self-start sm:self-auto flex items-center gap-2 bg-gray-800/10 hover:bg-gray-800/20 text-gray-800 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all disabled:opacity-40 border border-gray-800/10"
                        >
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

                <ProductsFilters
                    rawSearch={rawSearch}
                    brand={brand}
                    imageFilter={imageFilter}
                    brandOptions={brands.map(b => b.brand_name)}
                    hasFilters={hasFilters}
                    loading={loading}
                    onSearchChange={handleSearchChange}
                    onBrandChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleBrandClick(e.target.value)}
                    onImageFilterChange={handleImageFilterChange}
                    onClear={clearFilters}
                />

                {/* ── Error state ───────────────────────────────────────── */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4 text-red-600">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div>
                            <p className="font-black text-sm">Erro ao carregar produtos</p>
                            <p className="text-xs text-red-400 mt-0.5">{error}</p>
                        </div>
                        <button
                            onClick={refetch}
                            className="ml-auto bg-red-600 text-white text-xs font-black px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* ── Table ────────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 w-20">Imagem</th>
                                    <th className="px-6 py-4">Nome / Código</th>
                                    <th className="px-6 py-4">Marca</th>
                                    <th className="px-6 py-4 text-right">Preço Base</th>
                                    {isAdmin && <th className="px-6 py-4 text-center w-28">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {/* Loading skeletons */}
                                {loading &&
                                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)}

                                {/* Empty state */}
                                {!loading && pageItems.length === 0 && (
                                    <tr>
                                        <td colSpan={colCount} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <PackageSearch size={36} />
                                                <p className="font-black text-sm uppercase tracking-widest">
                                                    Nenhum produto encontrado
                                                </p>
                                                {hasFilters && (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="text-primary text-xs font-black underline underline-offset-2"
                                                    >
                                                        Limpar filtros
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Product rows */}
                                {!loading &&
                                    pageItems.map((p) => (
                                        <ProductRow
                                            key={p._id}
                                            product={p}
                                            isAdmin={isAdmin}
                                            onEdit={setEditProduct}
                                            onDelete={setDeleteProduct}
                                        />
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ──────────────────────────────────── */}
                    {!loading && total > PAGE_SIZE && (
                        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400 font-medium">
                                Página{' '}
                                <span className="font-black text-secondary">{page}</span> de{' '}
                                <span className="font-black text-secondary">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-100 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-100 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
