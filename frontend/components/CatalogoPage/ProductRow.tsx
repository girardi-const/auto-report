'use client';

import { Pencil, Trash2 } from "lucide-react";
import { ProductThumb } from "@/components/CatalogoPage/ProductThumb";
import { fmt } from "@/utils/formatters";
import { CatalogProduct } from "../../types";

type Props = {
    product: CatalogProduct;
    isAdmin: boolean;
    onEdit: (p: CatalogProduct) => void;
    onDelete: (p: CatalogProduct) => void;
};

export function ProductRow({ product: p, isAdmin, onEdit, onDelete }: Props) {
    return (

        <tr className="group hover:bg-gray-50/60 transition-colors">
            <td className="px-6 py-3">
                <ProductThumb src={p.imageurl} />
            </td>

            <td className="px-6 py-3 max-w-xs">
                <p className="font-semibold text-gray-700 text-sm leading-snug truncate">
                    {p.description || '—'}
                </p>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {p.product_code}
                </span>
            </td>

            <td className="px-6 py-3">
                <span className="inline-block bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    {p.brand_name}
                </span>
            </td>

            <td className="px-6 py-3 text-right">
                <span className="font-black text-secondary text-sm">
                    {fmt.format(p.base_price)}
                </span>
            </td>

            {isAdmin && (
                <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            title="Editar produto"
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                            onClick={() => onEdit(p)}>
                            <Pencil size={15} />
                        </button>
                        <button
                            title="Deletar produto"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            onClick={() => onDelete(p)}>
                            <Trash2 size={15} />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );
}