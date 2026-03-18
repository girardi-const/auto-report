import { Plus } from "lucide-react";
import { ProductTableProps } from "../types";
import { ProductRow } from "./ProductRow";

export function ProductTable({
    products,
    sectionId,
    brands,
    loadingProductId,
    sectionMargin,
    onUpdateProduct,
    onRemoveProduct,
    onAddProduct,
    onProductCodeChange,
}: ProductTableProps) {
    return (
        <div className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-gray-100">
                        <tr>
                            <th className="px-3 py-4">Código</th>
                            <th className="px-8 py-4">Imagem</th>
                            <th className="px-8 py-4">Marca</th>
                            <th className="px-8 py-4">Produto</th>
                            <th className="px-4 py-4 w-28">Preço Un.</th>
                            <th className="px-4 py-4 w-24">Und.</th>
                            <th className="px-4 py-4 w-24">Margem(%)</th>
                            <th className="px-4 py-4 w-24">Desc(%)</th>
                            <th className="px-8 py-4 text-right">Subtotal</th>
                            <th className="px-8 py-4 w-12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                sectionId={sectionId}
                                sectionMargin={sectionMargin}
                                brands={brands}
                                isLoading={loadingProductId === product.id}
                                onUpdate={(updates) => onUpdateProduct(product.id, updates)}
                                onRemove={() => onRemoveProduct(product.id)}
                                onCodeChange={(code) => onProductCodeChange(product.id, code)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={onAddProduct}
                className="w-full py-6 flex items-center justify-center gap-3 text-primary hover:bg-primary/5 transition-all font-black text-[11px] uppercase tracking-[0.3em] border-t border-dashed border-gray-100"
            >
                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                    <Plus size={14} strokeWidth={3} />
                </div>
                Adicionar Produto
            </button>
        </div>
    );
}

