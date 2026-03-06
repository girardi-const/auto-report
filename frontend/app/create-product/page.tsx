'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, FileJson, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useBrands } from "@/hooks/useBrands";
import { ImageUpload } from "@/components/ImageUpload";
import { formatPriceInput } from "@/utils/formatters";
import { api } from "@/lib/api";

export default function CreateProductPage() {
    const { user, loading, isAdmin, getIdToken } = useAuth();
    const router = useRouter();
    const { brands } = useBrands();
    const [formData, setFormData] = useState({
        description: "",
        code: "",
        price: "",
        brand: ""
    });

    const [image, setImage] = useState<File | null>(null);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, price: formatPriceInput(e.target.value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        if (!image) return alert("Por favor, selecione uma imagem do produto");

        setSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('code', formData.code);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('brand', formData.brand);
            formDataToSend.append('price', formData.price.replace(/\./g, '').replace(',', '.'));
            formDataToSend.append('image', image);

            const token = await getIdToken();
            const result = await api.post('/products/upload', formDataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Produto salvo com sucesso!\nURL da imagem: ${result.data.imageurl}`);
            setFormData({ description: "", code: "", price: "", brand: "" });
            setImage(null);
        } catch (error: any) {
            console.error("Erro ao salvar produto:", error);
            alert(`Erro ao salvar produto: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted flex flex-col pt-10 px-4 md:px-0 text-secondary">
            <div className="container mx-auto max-w-4xl pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> Voltar ao Início
                        </Link>
                        <h1 className="text-4xl font-black text-red- uppercase tracking-tighter italic">
                            Cadastrar <span className="text-primary italic">Novo</span> Produto
                        </h1>
                        <p className="text-gray-400 font-medium mt-1">Adicione produtos ao catálogo do sistema</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { icon: FileSpreadsheet, label: "Excel" },
                            { icon: FileText, label: "PDF" },
                            { icon: FileJson, label: "CSV" }
                        ].map(({ icon: Icon, label }) => (
                            <button key={label} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm">
                                <Icon size={16} /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-secondary p-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black italic shadow-lg">P</div>
                        <h2 className="text-white font-black text-xl uppercase tracking-tight">Informações do Produto</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ImageUpload image={image} previewUrl={null} onImageChange={setImage} />

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Nome do Produto</label>
                            <input
                                required
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="EX: TORNEIRA GOURMET PRETA"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none transition-all font-bold uppercase placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Código</label>
                            <input
                                required
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                placeholder="EX: 123456"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none transition-all font-black uppercase placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Preço Base (R$)</label>
                            <input
                                required
                                value={formData.price}
                                onChange={handlePriceChange}
                                placeholder="0,00"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none transition-all font-black text-primary text-xl placeholder:text-gray-300"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Marca</label>
                            <select
                                required
                                name="brand"
                                value={formData.brand}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none transition-all font-black appearance-none cursor-pointer"
                            >
                                <option value="">SELECIONE A MARCA</option>
                                {brands.map((brand) => (
                                    <option key={brand._id} value={brand.brand_name}>{brand.brand_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-secondary text-white font-black px-10 py-5 rounded-full hover:bg-primary transition-all flex items-center gap-3 uppercase text-sm tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {saving ? "Salvando..." : <><Save size={20} /> Salvar Produto</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
