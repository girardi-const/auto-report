'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useBrands, Brand } from '@/hooks/useBrands';
import { BrandModal } from '@/components/CriarProdutosItems/BrandModal';
import { toast } from 'sonner';
import {
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    RefreshCcw,
    Tag,
    Package,
    AlertTriangle,
    X,
} from 'lucide-react';

// ─── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100">
            <td className="px-6 py-4">
                <div className="h-4 rounded bg-gray-100 animate-pulse w-40" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 rounded bg-gray-100 animate-pulse w-16 mx-auto" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 rounded bg-gray-100 animate-pulse w-20 mx-auto" />
            </td>
        </tr>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteBrandModal({
    brand,
    onClose,
    onConfirm,
    isDeleting,
}: {
    brand: Brand;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-red-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle size={18} className="text-white" />
                        </div>
                        <h2 className="text-white font-bold uppercase tracking-tight">
                            Excluir Marca
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                        <p className="text-red-800 font-bold text-lg uppercase">
                            {brand.brand_name}
                        </p>
                        {(brand.productCount ?? 0) > 0 && (
                            <p className="text-red-600 text-sm mt-1 font-medium">
                                {brand.productCount} produto{brand.productCount !== 1 ? 's' : ''} será{brand.productCount !== 1 ? 'ão' : ''} excluído{brand.productCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    <p className="text-gray-500 text-sm text-center leading-relaxed">
                        Esta ação é <span className="font-bold text-red-600">irreversível</span>.
                        Todos os produtos associados a esta marca serão permanentemente removidos do sistema.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors uppercase text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 text-white font-black px-8 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 uppercase text-xs shadow-lg disabled:opacity-50"
                        >
                            {isDeleting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            Excluir Marca
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarcasPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const { brands, loading, error, refreshBrands, createBrand, deleteBrand } = useBrands();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Auth guard — require logged in
    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
    }, [user, authLoading, router]);

    const handleDelete = async () => {
        if (!brandToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteBrand(brandToDelete._id);
            toast.success(
                `Marca "${result.deletedBrand}" excluída! ${result.deletedProductsCount} produto(s) removido(s).`
            );
            setBrandToDelete(null);
            refreshBrands();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao excluir marca');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateBrand = async (brandName: string) => {
        await createBrand(brandName);
        refreshBrands();
    };

    const totalProducts = brands.reduce((sum, b) => sum + (b.productCount ?? 0), 0);

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
            {/* Delete Modal */}
            {brandToDelete && (
                <DeleteBrandModal
                    brand={brandToDelete}
                    onClose={() => setBrandToDelete(null)}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                />
            )}

            {/* Create Modal */}
            <BrandModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateBrand}
            />

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="px-6 py-6">
                <div className="max-w-5xl px-7 mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-gray-800 font-black text-2xl tracking-tight uppercase">
                            Marcas
                        </h1>
                        <p className="text-gray-800/40 text-xs font-medium mt-0.5">
                            {loading
                                ? 'Carregando…'
                                : `${brands.length} marca${brands.length !== 1 ? 's' : ''} · ${totalProducts} produto${totalProducts !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 bg-secondary text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-primary transition-all shadow-lg"
                            >
                                <Plus size={14} />
                                Nova Marca
                            </button>
                        )}
                        <button
                            onClick={refreshBrands}
                            disabled={loading}
                            title="Atualizar lista"
                            className="flex items-center gap-2 bg-gray-800/10 hover:bg-gray-800/20 text-gray-800 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all disabled:opacity-40 border border-gray-800/10"
                        >
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex flex-col gap-5">
                {/* ── Stats Cards ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center">
                            <Tag size={20} className="text-secondary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                Total Marcas
                            </p>
                            <p className="text-2xl font-black text-gray-800">
                                {loading ? '–' : brands.length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Package size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                Total Produtos
                            </p>
                            <p className="text-2xl font-black text-gray-800">
                                {loading ? '–' : totalProducts}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Error state ─────────────────────────────────────── */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4 text-red-600">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div>
                            <p className="font-black text-sm">Erro ao carregar marcas</p>
                            <p className="text-xs text-red-400 mt-0.5">{error.message}</p>
                        </div>
                        <button
                            onClick={refreshBrands}
                            className="ml-auto bg-red-600 text-white text-xs font-black px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* ── Table ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Marca</th>
                                    <th className="px-6 py-4 text-center">Produtos</th>
                                    {isAdmin && (
                                        <th className="px-6 py-4 text-center w-28">Ações</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {/* Loading skeletons */}
                                {loading &&
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <SkeletonRow key={i} />
                                    ))}

                                {/* Empty state */}
                                {!loading && brands.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={isAdmin ? 3 : 2}
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <Tag size={36} />
                                                <p className="font-black text-sm uppercase tracking-widest">
                                                    Nenhuma marca cadastrada
                                                </p>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setShowCreateModal(true)}
                                                        className="text-primary text-xs font-black underline underline-offset-2"
                                                    >
                                                        Criar primeira marca
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Brand rows */}
                                {!loading &&
                                    brands.map((b) => (
                                        <tr
                                            key={b._id}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary font-black text-xs">
                                                        {b.brand_name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-800 uppercase tracking-wide">
                                                        {b.brand_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${(b.productCount ?? 0) > 0
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    <Package size={12} />
                                                    {b.productCount ?? 0}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setBrandToDelete(b)}
                                                        title="Excluir marca"
                                                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
