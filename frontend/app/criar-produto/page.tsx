'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, FileJson, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useBrands } from "@/hooks/useBrands";
import { ProductForm } from "@/components/CriarProdutosItems/ProductForm";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function CreateProductPage() {
    const { user, loading, isAdmin, getIdToken } = useAuth();
    const router = useRouter();
    const { brands } = useBrands();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/sign-in');
            else if (!isAdmin) router.push('/');
        }
    }, [user, loading, isAdmin, router]);

    if (loading || !user || !isAdmin) {
        return loading ? (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-gray-500 italic font-medium">Carregando...</div>
            </div>
        ) : null;
    }

    const handleSubmit = async (data: {
        description: string;
        code: string;
        price: string;
        brand: string;
        image: File | null;
    }) => {
        if (saving) return;

        setSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('code', data.code);
            formDataToSend.append('description', data.description);
            formDataToSend.append('brand', data.brand);
            formDataToSend.append('price', data.price.replace(/\./g, '').replace(',', '.'));
            if (data.image) {
                formDataToSend.append('image', data.image);
            }

            const token = await getIdToken();
            const result = await api.post('/products/upload', formDataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Produto salvo com sucesso!`);
        } catch (error: any) {
            console.error("Erro ao salvar produto:", error);
            toast.error(`Erro ao salvar produto: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted">
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="px-6 py-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-gray-800 font-black text-2xl tracking-tight uppercase ">
                            Cadastrar <span className="text-primary">Novo</span> Produto
                        </h1>
                        <p className="text-gray-800/40 text-xs font-medium mt-0.5">
                            Adicione produtos ao catálogo do sistema
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/importar" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm">
                            <FileSpreadsheet size={16} /> Importar Produtos
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
                <ProductForm onSubmit={handleSubmit} brands={brands} loading={saving} />
            </div>
        </div>
    );
}
