import { Trash2, Loader2 } from "lucide-react";
import { Product } from "../types";
import { formatCurrency } from "../utils/formatters";

interface ProductRowProps {
    product: Product;
    sectionId: string;
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
    onUpdate,
    onRemove,
    onCodeChange,
}: ProductRowProps) {
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
                <span className={`${product.priceBase === 0 ? "text-gray-300" : "text-gray-500"} italic text-[11px] font-medium leading-tight block truncate max-w-[150px]`}>
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
                    className="text-gray-200 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
}
