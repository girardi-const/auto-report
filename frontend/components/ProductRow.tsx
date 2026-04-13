import React, { useState, useEffect } from "react";
import { Trash2, Loader2, UploadCloud, Search } from "lucide-react";
import { toast } from "sonner";
import { Product, CatalogProduct } from "../types";
import { formatCurrency, formatPriceInput, parseLocaleNumber } from "../utils/formatters";
import Image from "next/image";
import { getProxyImageUrl } from "@/utils/image";
import { useAuth } from "@/contexts/AuthContext";
import { SearchProductModal } from "./SearchProductModal";

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
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [savePriceError, setSavePriceError] = useState<string | null>(null);
    const [localPriceText, setLocalPriceText] = useState(() =>
        product.priceBase.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [localUnits, setLocalUnits] = useState(product.units.toString());
    const [isUnitsFocused, setIsUnitsFocused] = useState(false);
    const [localMargin, setLocalMargin] = useState(product.margin.toString());
    const [isMarginFocused, setIsMarginFocused] = useState(false);
    const [localDiscount, setLocalDiscount] = useState(product.discount.toString());
    const [isDiscountFocused, setIsDiscountFocused] = useState(false);

    const isInvalid = !product.code || product.name === "Produto não encontrado";

    const handleSearchSelect = (catalogProduct: CatalogProduct) => {
        onCodeChange(catalogProduct.product_code);
    };

    useEffect(() => {
        if (!isFocused) {
            setLocalPriceText(product.priceBase.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    }, [product.priceBase, isFocused]);

    useEffect(() => {
        if (!isUnitsFocused) {
            setLocalUnits(product.units.toString());
        }
    }, [product.units, isUnitsFocused]);

    const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isDecimal = product.type !== "UN" && !!product.type;
        let val = e.target.value;
        if (isDecimal) {
            val = val.replace(/[^0-9.,]/g, "").replace(",", ".");
            setLocalUnits(val);
            const numeric = parseFloat(val);
            if (!isNaN(numeric) && numeric > 0) {
                onUpdate({ units: numeric });
            }
        } else {
            val = val.replace(/\D/g, ""); // Apenas números
            setLocalUnits(val);
            const numeric = parseInt(val, 10);
            if (!isNaN(numeric) && numeric > 0) {
                onUpdate({ units: numeric });
            }
        }
    };

    useEffect(() => {
        if (!isMarginFocused) {
            setLocalMargin(product.margin.toString());
        }
    }, [product.margin, isMarginFocused]);

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9.-]/g, ""); // Permite números, ponto decimal e sinal de menos
        setLocalMargin(val);
        const numeric = parseFloat(val);
        if (!isNaN(numeric)) {
            onUpdate({ margin: numeric });
        }
    };

    useEffect(() => {
        if (!isDiscountFocused) {
            setLocalDiscount(product.discount.toString());
        }
    }, [product.discount, isDiscountFocused]);

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9.-]/g, "");
        setLocalDiscount(val);
        const numeric = parseFloat(val);
        if (!isNaN(numeric)) {
            onUpdate({ discount: numeric });
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPriceInput(e.target.value);
        setLocalPriceText(formatted);
        const numeric = parseLocaleNumber(formatted);
        if (!isNaN(numeric)) {
            onUpdate({ priceBase: numeric });
        }
    };

    const localPriceNumeric = parseLocaleNumber(localPriceText);
    const isPriceChanged = product.originalPriceBase !== undefined && product.priceBase !== product.originalPriceBase;

    const handleSavePrice = () => {
        if (!isNaN(localPriceNumeric)) {
            setShowConfirmModal(true);
        }
    };

    const confirmSavePrice = async () => {
        if (!product.dbId) {
            setSavePriceError("Este produto não possui um ID de banco de dados.");
            return;
        }
        try {
            setIsSavingPrice(true);
            setSavePriceError(null);
            const token = await getIdToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
            const res = await fetch(`${API_URL}/products/${product.dbId}/price`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ base_price: localPriceNumeric }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error?.message || "Erro ao salvar preço");
            }
            // Sync so the "Salvar" badge disappears
            onUpdate({ priceBase: localPriceNumeric, originalPriceBase: localPriceNumeric });
            setShowConfirmModal(false);
        } catch (err: any) {
            setSavePriceError(err.message || "Erro inesperado");
        } finally {
            setIsSavingPrice(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Formato de imagem inválido", {
                description: `Apenas arquivos de imagem são suportados. O arquivo "${file.name}" não é permitido.`,
                duration: 5000,
            });
            return;
        }

        if (!product.dbId) {
            toast.error("Produto não encontrado no banco de dados.");
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

    const subtotal = (localPriceNumeric + (localPriceNumeric * product.margin / 100)) *
        (1 - (product.discount || 0) / 100) *
        product.units;

    return (
        <tr className="group hover:bg-gray-50/50 transition-colors">
            <td className="px-2 py-3 relative">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        title="Buscar produto por nome"
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-300 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                        <Search size={12} strokeWidth={2.5} />
                    </button>
                    <div className="relative flex-1 min-w-[90px]">
                        <input
                            type="text"
                            value={product.code}
                            onChange={(e) => onCodeChange(e.target.value)}
                            placeholder="Código..."
                            className={`w-full bg-transparent outline-none font-bold text-xs border-2 rounded-lg px-2 py-2 transition-all ${isLoading ? "border-primary/30" : "border-gray-100 focus:border-primary"
                                } focus:bg-white`}
                        />
                        {isLoading && (
                            <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 text-center">
                <div className="relative group/image w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 hover:border-primary transition-colors flex items-center justify-center bg-gray-50">
                    {isUploadingImage ? (
                        <Loader2 size={24} className="animate-spin text-primary" />
                    ) : product.dbId ? (
                        product.image ? (
                            <>
                                <Image src={getProxyImageUrl(product.image) || "/placeholder.webp"} alt={product.name} width={68} height={68} className="w-full h-full object-cover" unoptimized />
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
                        <Image src={getProxyImageUrl(product.image) || "/placeholder.webp"} alt="Placeholder" width={68} height={68} className="w-full h-full object-cover" unoptimized />
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <select
                    value={product.brand}
                    onChange={(e) => onUpdate({ brand: e.target.value })}
                    disabled={isInvalid}
                    className="w-full bg-transparent outline-none font-bold text-xs border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <option value="">Selecione a Marca</option>
                    {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3 align-middle">
                <textarea
                    value={product.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    rows={3}
                    disabled={isInvalid}
                    className={`w-full bg-transparent outline-none border-none resize-none italic text-xs font-medium leading-snug break-words whitespace-normal text-start ${isInvalid ? "text-gray-300 cursor-not-allowed" : "text-gray-800"}`}
                />
            </td>
            <td className="px-4 py-4 relative">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-xs pl-2">R$</span>
                    <input
                        type="text"
                        value={localPriceText}
                        onChange={handlePriceChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isInvalid}
                        className={`w-24 bg-transparent outline-none font-black border-2 rounded-lg px-2 py-2 transition-all text-right text-xs ${isPriceChanged
                            ? 'border-primary/40 bg-primary/5 text-primary focus:border-primary focus:bg-white'
                            : 'border-gray-100 focus:border-primary focus:bg-white'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                    <div
                        className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-out ${isPriceChanged ? 'max-w-[60px] opacity-100' : 'max-w-0 opacity-0'
                            }`}
                    >
                        <button
                            onClick={handleSavePrice}
                            title="Salvar novo preço"
                            className="flex items-center gap-1 border border-primary/30 text-primary bg-primary/8 hover:bg-primary hover:text-white hover:border-primary text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap"
                        >
                            ✓ ok
                        </button>
                    </div>
                </div>
            </td>
            <td className="px-1 py-4">
                <input
                    type="text"
                    inputMode={product.type && product.type !== "UN" ? "decimal" : "numeric"}
                    value={localUnits}
                    onChange={handleUnitsChange}
                    onFocus={() => setIsUnitsFocused(true)}
                    onBlur={() => {
                        setIsUnitsFocused(false);
                        const isDecimal = product.type !== "UN" && !!product.type;
                        const numValue = isDecimal ? parseFloat(localUnits) : parseInt(localUnits, 10);
                        if (!localUnits || isNaN(numValue) || numValue <= 0) {
                            setLocalUnits("1");
                            onUpdate({ units: 1 });
                        } else if (!isDecimal) {
                            setLocalUnits(numValue.toString());
                            onUpdate({ units: numValue });
                        }
                    }}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-4 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isInvalid}
                />
            </td>
            <td className="px-4 py-4">
                <select
                    value={product.type || "UN"}
                    onChange={(e) => onUpdate({ type: e.target.value })}
                    disabled={isInvalid}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <option value="UN">UN</option>
                    <option value="MT">MT²</option>
                    <option value="KG">KG</option>
                    <option value="LT">LT</option>
                    <option value="M">M</option>
                </select>
            </td>
            <td className="px-4 py-4">
                <input
                    type="text"
                    inputMode="decimal"
                    value={localMargin}
                    onChange={handleMarginChange}
                    onFocus={() => setIsMarginFocused(true)}
                    onBlur={() => {
                        setIsMarginFocused(false);
                        if (!localMargin || isNaN(parseFloat(localMargin))) {
                            const defaultVal = "0";
                            setLocalMargin(defaultVal);
                            onUpdate({ margin: 0 });
                        }
                    }}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isInvalid}
                />
            </td>
            <td className="px-4 py-4">
                <input
                    type="text"
                    inputMode="decimal"
                    value={localDiscount}
                    onChange={handleDiscountChange}
                    onFocus={() => setIsDiscountFocused(true)}
                    onBlur={() => {
                        setIsDiscountFocused(false);
                        if (!localDiscount || isNaN(parseFloat(localDiscount))) {
                            const defaultVal = "0";
                            setLocalDiscount(defaultVal);
                            onUpdate({ discount: 0 });
                        }
                    }}
                    className="w-full bg-transparent outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-2 focus:border-primary focus:bg-white transition-all text-center text-xs text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isInvalid}
                />
            </td>
            <td className="px-4 py-4 text-right">
                <span className="font-black text-secondary text-sm">
                    {formatCurrency(subtotal)}
                </span>
            </td>
            <td className="px-4 py-4 text-center">
                <button
                    onClick={onRemove}
                    className="text-red-400 hover:text-red-600 transition-all opacity-40 group-hover:opacity-100"
                >
                    <Trash2 size={18} />
                </button>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full border border-gray-100 mx-4">
                            <h3 className="text-lg font-black text-gray-800 mb-2 text-left">Confirmar Alteração</h3>

                            <p className="text-sm text-gray-500 mb-2 leading-relaxed text-left">
                                Você quer mudar o valor do produto <span className="font-bold text-gray-700">{product.name}</span> para <span className="font-bold text-primary">{formatCurrency(localPriceNumeric)}</span>?
                            </p>

                            {/* Nova mensagem informativa */}
                            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 mb-4 leading-snug">
                                ⚠️ Alteração de Preço Base: Esta ação define o novo valor padrão para este produto. Ao selecioná-lo em novos orçamentos, este será o preço carregado automaticamente.
                            </p>

                            {savePriceError && (
                                <p className="text-xs text-red-500 font-semibold mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {savePriceError}
                                </p>
                            )}

                            <div className="flex gap-3 justify-end">
                                <button
                                    disabled={isSavingPrice}
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSavePriceError(null);
                                        setLocalPriceText(product.priceBase.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmSavePrice}
                                    disabled={isSavingPrice}
                                    className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
                                >
                                    {isSavingPrice && <Loader2 size={12} className="animate-spin" />}
                                    {isSavingPrice ? "Salvando..." : "Confirmar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <SearchProductModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={handleSearchSelect}
                />
            </td>
        </tr>
    );
}
