import { Trash2, PackageSearch } from "lucide-react";
import { SearchProductModal } from "./SearchProductModal";
import { useState } from "react";
import { Section, Product, SectionCardProps, CartItem } from "../types";
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleModalClose = () => setIsModalOpen(false);

    const handleConfirm = (items: CartItem[]) => {
        if (items.length > 0) {
            actions.batchAddProducts(section.id, items);
        }
        setIsModalOpen(false);
    };

    return (
        <>
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

                    <div className="flex items-center gap-6">
                        {/* Add Products Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-all bg-white/10 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider"
                            title="Adicionar Produtos da Seção"
                        >
                            <PackageSearch size={18} />
                            Adicionar Produtos da Seção
                        </button>

                        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                            <span className="text-white/40 text-xs uppercase font-bold tracking-widest">Margem</span>
                            <input
                                type="text"
                                value={section.margin_section || 0}
                                onChange={(e) => actions.updateSectionMargin(section.id, parseFloat(e.target.value))}
                                className="w-16 bg-white/5 text-white font-bold font-mono text-sm p-1 rounded border border-white/10 outline-none focus:border-primary/50 transition-all text-center"
                            />
                            <span className="text-white/40 text-xs">%</span>
                        </div>
                        <button
                            onClick={() => actions.removeSection(section.id)}
                            className="text-white/20 hover:text-primary transition-all hover:scale-110"
                            title="Remover Seção"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Products Table */}
                <ProductTable
                    products={section.products}
                    sectionId={section.id}
                    sectionMargin={Number(section.margin_section)}
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

            {/* Search Product Modal */}
            <SearchProductModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onConfirm={handleConfirm}
                multiSelect={true}
            />
        </>
    );
}

