'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useProducts } from '../../hooks/useProducts';
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

// ─── Image cell with placeholder fallback ────────────────────────────────────
function ProductThumb({ src }: { src: string }) {
    const [err, setErr] = useState(false);

    if (!src || err) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <PackageSearch size={20} className="text-gray-300" />
            </div>
        );
    }

    return (
        <div className="relative w-12 h-12 flex-shrink-0">
            <Image
                src={src}
                alt="product-image"
                fill
                sizes="48px"
                className="object-contain rounded-lg"
                loading="lazy"
                onError={() => setErr(true)}
            />
        </div>
    );
}

// ─── Edit Product Modal ─────────────────────────────────────────────────────

function EditProductModal({ product, onClose, onSaved, getIdToken }: EditModalProps) {
    const [description, setDescription] = useState(product.description || '');
    const [brandName, setBrandName] = useState(product.brand_name);
    const [basePrice, setBasePrice] = useState(
        product.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const token = await getIdToken();
            const formattedPrice = parseFloat(basePrice.replace(/\./g, '').replace(',', '.'));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    description: description.toUpperCase(),
                    brand_name: brandName.toUpperCase(),
                    base_price: formattedPrice,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao atualizar produto');
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Editar Produto</p>
                        <p className="font-black text-secondary text-sm truncate max-w-xs">{product.product_code}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-primary transition-colors p-1 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome / Descrição</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-secondary focus:border-primary focus:bg-white outline-none transition-all uppercase"
                            placeholder="NOME DO PRODUTO"
                        />
                    </div>

                    {/* Brand */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Marca</label>
                        <input
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            required
                            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-secondary focus:border-primary focus:bg-white outline-none transition-all uppercase"
                            placeholder="MARCA"
                        />
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preço Base (R$)</label>
                        <input
                            value={basePrice}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                const num = Number(raw) / 100;
                                setBasePrice(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            required
                            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-primary focus:border-primary focus:bg-white outline-none transition-all"
                            placeholder="0,00"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:border-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-white font-black text-xs uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Salvando…' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ───────────────────────────────────────────────────
interface DeleteModalProps {
    product: CatalogProduct;
    onClose: () => void;
    onDeleted: () => void;
    getIdToken: () => Promise<string>;
}

function DeleteConfirmModal({ product, onClose, onDeleted, getIdToken }: DeleteModalProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setDeleting(true);
        setError('');
        try {
            const token = await getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao deletar produto');
            }

            onDeleted();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="p-6 flex flex-col gap-5">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <Trash2 size={22} className="text-red-500" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-secondary text-base">Deletar produto?</p>
                        <p className="text-sm text-gray-400 mt-1 font-medium">
                            {product.description || product.product_code}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">Esta ação não pode ser desfeita.</p>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:border-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            {deleting ? 'Deletando…' : 'Deletar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
    const { user, loading: authLoading, isAdmin, getIdToken } = useAuth();
    const router = useRouter();
    const { products, loading, error, refetch } = useProducts();

    // Modals state
    const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<CatalogProduct | null>(null);

    // ── Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
    }, [user, authLoading, router]);

    // ── Search state (raw input) + debounced value
    const [rawSearch, setRawSearch] = useState('');
    const [search, setSearch] = useState('');
    const [brand, setBrand] = useState('');
    const [page, setPage] = useState(1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRawSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(val.trim());
            setPage(1);
        }, 300);
    }, []);

    const handleBrandChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setBrand(e.target.value);
        setPage(1);
    }, []);

    const clearFilters = useCallback(() => {
        setRawSearch('');
        setSearch('');
        setBrand('');
        setPage(1);
    }, []);

    // ── Derived brand list (unique, sorted)
    const brandOptions = useMemo(
        () => [...new Set(products.map((p) => p.brand_name))].sort(),
        [products]
    );

    // ── Filtered list
    const filtered = useMemo<CatalogProduct[]>(() => {
        const q = search.toUpperCase();
        return products.filter((p) => {
            const matchesBrand = brand ? p.brand_name === brand : true;
            const matchesSearch = q
                ? p.product_code.includes(q) || (p.description || '').toUpperCase().includes(q)
                : true;
            return matchesBrand && matchesSearch;
        });
    }, [products, search, brand]);

    // ── Pagination slice
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageItems = useMemo(
        () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
        [filtered, safePage]
    );

    const hasFilters = rawSearch !== '' || brand !== '';
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
                                : `${filtered.length} de ${products.length} produtos`}
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
                {/* ── Filters ──────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                        />
                        <input
                            id="product-search"
                            type="text"
                            value={rawSearch}
                            onChange={handleSearchChange}
                            placeholder="Buscar por código ou nome…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    {/* Brand filter */}
                    <select
                        id="brand-filter"
                        value={brand}
                        onChange={handleBrandChange}
                        className="w-full sm:w-56 px-4 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white appearance-none cursor-pointer"
                    >
                        <option value="">Todas as marcas</option>
                        {brandOptions.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>

                    {/* Clear */}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors whitespace-nowrap px-2"
                        >
                            <X size={14} /> Limpar
                        </button>
                    )}
                </div>

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
                                {!loading && filtered.length === 0 && (
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
                                        <tr
                                            key={p._id}
                                            className="group hover:bg-gray-50/60 transition-colors"
                                        >
                                            {/* Thumbnail */}
                                            <td className="px-6 py-3">
                                                <ProductThumb src={p.imageurl} />
                                            </td>

                                            {/* Name + code */}
                                            <td className="px-6 py-3 max-w-xs">
                                                <p className="font-semibold text-gray-700 text-sm leading-snug truncate">
                                                    {p.description || '—'}
                                                </p>
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                    {p.product_code}
                                                </span>
                                            </td>

                                            {/* Brand */}
                                            <td className="px-6 py-3">
                                                <span className="inline-block bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                                    {p.brand_name}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td className="px-6 py-3 text-right">
                                                <span className="font-black text-secondary text-sm">
                                                    {fmt.format(p.base_price)}
                                                </span>
                                            </td>

                                            {/* Admin actions */}
                                            {isAdmin && (
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditProduct(p)}
                                                            title="Editar produto"
                                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteProduct(p)}
                                                            title="Deletar produto"
                                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ──────────────────────────────────── */}
                    {!loading && filtered.length > PAGE_SIZE && (
                        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400 font-medium">
                                Página{' '}
                                <span className="font-black text-secondary">{safePage}</span> de{' '}
                                <span className="font-black text-secondary">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="p-2 rounded-lg border border-gray-100 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
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
