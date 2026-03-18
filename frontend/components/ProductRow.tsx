import React, { useState } from "react";
import { Trash2, Loader2, UploadCloud } from "lucide-react";
import { Product } from "../types";
import { formatCurrency } from "../utils/formatters";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface ProductRowProps {
    product: Product;
    sectionId: string;
    sectionMargin: number;
    brands: string[];
    isLoading: boolean;
    onUpdate: (updates: Partial<Product>) => void;
    onRemove: () => void;
    onCodeChange: (code: string) => void;
}

export function ProductRow({
    product,
    brands,
    isLoading,
    sectionMargin,
    onUpdate,
    onRemove,
    onCodeChange,
}: ProductRowProps) {
    const { getIdToken } = useAuth();
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleImageUpload = async (file: File) => {
        if (!product.dbId) {
            alert("Este produto não foi encontrado no banco de dados.");
            return;
        }

        try {
            setIsUploadingImage(true);
            const token = await getIdToken();
            const formData = new FormData();
            formData.append('image', file);

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
            const res = await fetch(`${API_URL}/products/${product.dbId}/image`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error("Erro ao atualizar imagem");
            }

            const data = await res.json();
            if (data.data?.imageurl) {
                onUpdate({ image: data.data.imageurl });
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Não foi possível atualizar a imagem.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const subtotal = (product.priceBase + (product.priceBase * product.margin / 100)) *
        (1 - (product.discount || 0) / 100) *
        product.units;

    return (
        <tr className="group hover:bg-gray-50/50 transition-colors">
            <td className="px-8 py-4 relative">
                <input
                    type="text"
                    value={product.code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    placeholder="TENTE: 123"
                    className={`w-full bg-transparent outline-none font-bold text-xs border-2 rounded-lg px-3 py-2 transition-all ${isLoading ? "border-primary/30" : "border-gray-100 focus:border-primary"
                        } focus:bg-white`}
                />
                {isLoading && (
                    <Loader2 size={12} className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                )}
            </td>
            <td className="px-8 py-4">
                <div className="relative group/image w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 hover:border-primary transition-colors flex items-center justify-center bg-gray-50">
                    {isUploadingImage ? (
                        <Loader2 size={24} className="animate-spin text-primary" />
                    ) : product.dbId ? (
                        product.image ? (
                            <>
                                <Image src={product.image} alt={product.name} width={68} height={68} className="w-full h-full object-cover" />
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                    <UploadCloud size={16} className="text-white mb-1" />
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest text-center px-1">Alterar</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                                </label>
                            </>
                        ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest text-center leading-tight px-1">Produto sem foto<br />Adicione</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                            </label>
                        )
                    ) : (
                        <Image src="/placeholder.webp" alt="Placeholder" width={68} height={68} className="w-full h-full object-cover opacity-40 grayscale" />
                    )}
                </div>
            </td>
            <td className="px-8 py-4">
                <select
                    value={product.brand}
                    onChange={(e) => onUpdate({ brand: e.target.value })}
                    className="w-full bg-transparent outline-none font-bold text-xs border-2 border-gray-100 rounded-lg px-3 py-2 focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer"
                >
                    <option value="">Selecione a Marca</option>
                    {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
            </td>
            <td className="px-8 py-4">
                <span className={`${product.priceBase === 0 ? "text-gray-300" : "text-gray-500"} italic text-[11px] font-medium leading-tight block whitespace-normal break-words max-w-[250px]`}>
                    {product.name}
                </span>
            </td>
            <td className="px-4 py-4">
                <input
                    type="number"
                    value={product.units}
                    onChange={(e) => onUpdate({ units: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs"
                />
            </td>
            <td className="px-4 py-4">
                <input
                    type="number"
                    value={product.margin}
                    onChange={(e) => onUpdate({ margin: Number(e.target.value) })}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs"
                />
            </td>
            <td className="px-4 py-4">
                <input
                    type="number"
                    value={product.discount}
                    onChange={(e) => onUpdate({ discount: Number(e.target.value) })}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs text-primary"
                />
            </td>
            <td className="px-8 py-4 text-right">
                <span className="font-black text-secondary text-sm">
                    {formatCurrency(subtotal)}
                </span>
            </td>
            <td className="px-8 py-4 text-center">
                <button
                    onClick={onRemove}
                    className="text-red-400 hover:text-red-600 transition-all opacity-40 group-hover:opacity-100"
                >
                    <Trash2 size={18} />
                </button>
            </td>
        </tr>
    );
}
