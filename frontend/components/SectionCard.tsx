import { Trash2 } from "lucide-react";
import { Section, Product, SectionCardProps } from "../types";
import { ProductTable } from "./ProductTable";
import { formatCurrency } from "../utils/formatters";

export function SectionCard({
    section,
    brands,
    loadingProductId,
    actions,
    utils,
    onProductCodeChange,
}: SectionCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
            {/* Section Header */}
            <div className="bg-secondary p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-black italic">
                        G
                    </div>
                    <input
                        type="text"
                        value={section.name}
                        onChange={(e) => actions.updateSectionName(section.id, e.target.value)}
                        className="bg-transparent text-white font-black text-lg outline-none border-b-2 border-transparent focus:border-primary/50 transition-all uppercase tracking-tight"
                    />
                </div>
                <button
                    onClick={() => actions.removeSection(section.id)}
                    className="text-white/20 hover:text-primary transition-all hover:scale-110"
                    title="Remover Seção"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Products Table */}
            <ProductTable
                products={section.products}
                sectionId={section.id}
                brands={brands}
                loadingProductId={loadingProductId}
                onUpdateProduct={(productId, updates) => actions.updateProduct(section.id, productId, updates)}
                onRemoveProduct={(productId) => actions.removeProduct(section.id, productId)}
                onAddProduct={() => actions.addProduct(section.id)}
                onProductCodeChange={(productId, code) => onProductCodeChange(section.id, productId, code)}
            />

            {/* Section Footer */}
            <div className="bg-muted/30 px-8 py-4 flex justify-end items-center gap-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Desc. Seção (%)</label>
                    <input
                        type="number"
                        value={section.discount}
                        onChange={(e) => actions.updateSectionDiscount(section.id, Number(e.target.value))}
                        className="w-20 bg-white outline-none font-black border-2 border-gray-100 rounded-lg px-2 py-1 focus:border-primary transition-all text-center text-xs text-primary"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subtotal da Seção</span>
                    <span className="text-xl font-black text-secondary">
                        {formatCurrency(utils.calculateSubtotal(section.products, section.discount))}
                    </span>
                </div>
            </div>
        </div>
    );
}
