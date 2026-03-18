'use client';

import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { formatPriceInput } from "@/utils/formatters";
import { Save } from "lucide-react";
import { toast } from "sonner";

type Props = {
    brands: { _id: string; brand_name: string }[];
    onSubmit: (data: {
        description: string;
        code: string;
        price: string;
        brand: string;
        image: File | null;
    }) => Promise<void>;
    loading?: boolean;
};

export function ProductForm({ brands, onSubmit, loading }: Props) {
    const [formData, setFormData] = useState({
        description: "",
        code: "",
        price: "",
        brand: ""
    });

    const [image, setImage] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

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

        if (!image) {
            toast.error("Por favor, selecione uma imagem do produto");
            return;
        }

        setSaving(true);
        try {
            await onSubmit({
                ...formData,
                image
            });

            // reset form
            setFormData({
                description: "",
                code: "",
                price: "",
                brand: ""
            });
            setImage(null);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
            <div className="bg-secondary p-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black italic shadow-lg">
                    P
                </div>
                <h2 className="text-white font-black text-xl uppercase tracking-tight">
                    Informações do Produto
                </h2>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUpload image={image} previewUrl={null} onImageChange={setImage} />

                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">
                        Nome do Produto
                    </label>
                    <input
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="EX: TORNEIRA GOURMET PRETA"
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none font-bold uppercase"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
                        Código
                    </label>
                    <input
                        required
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none font-black uppercase"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
                        Preço Base (R$)
                    </label>
                    <input
                        required
                        value={formData.price}
                        onChange={handlePriceChange}
                        placeholder="0,00"
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none font-black text-primary text-xl"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
                        Marca
                    </label>
                    <select
                        required
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none font-black"
                    >
                        <option value="">SELECIONE A MARCA</option>
                        {brands.map((brand) => (
                            <option key={brand._id} value={brand.brand_name}>
                                {brand.brand_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 p-8 flex justify-end">
                <button
                    type="submit"
                    disabled={saving || loading}
                    className="bg-secondary text-white font-black px-10 py-5 rounded-full hover:bg-primary transition-all flex items-center gap-3 uppercase text-sm shadow-xl disabled:opacity-50"
                >
                    {saving ? "Salvando..." : <><Save size={20} /> Salvar Produto</>}
                </button>
            </div>
        </form>
    );
}