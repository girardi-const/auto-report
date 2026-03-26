'use client';

import { Search, X, Loader2 } from "lucide-react";

type Props = {
    rawSearch: string;
    brand: string;
    imageFilter: string;
    brandOptions: string[];
    hasFilters: boolean;
    loading?: boolean;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBrandChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onImageFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onClear: () => void;
};

export function ProductsFilters(props: Props) {
    const {
        rawSearch,
        brand,
        imageFilter,
        brandOptions,
        hasFilters,
        loading,
        onSearchChange,
        onBrandChange,
        onImageFilterChange,
        onClear
    } = props;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                    value={rawSearch}
                    onChange={onSearchChange}
                    placeholder="Buscar por código ou nome"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary focus:bg-white bg-gray-50 outline-none transition-all font-medium"
                />
                {loading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                )}
            </div>

            <select value={brand} onChange={onBrandChange} className="w-full sm:w-56 px-4 py-2.5 border-2 border-gray-100 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all appearance-none cursor-pointer">
                <option value="">Todas as marcas</option>
                {(brandOptions || []).map((b) => (
                    <option key={b} value={b}>{b}</option>
                ))}
            </select>

            <select value={imageFilter} onChange={onImageFilterChange} className="w-full sm:w-56 px-4 py-2.5 border-2 border-gray-100 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all appearance-none cursor-pointer">
                <option value="">Todas as imagens</option>
                <option value="true">Com imagem</option>
                <option value="false">Sem imagem</option>
            </select>

            {hasFilters && (
                <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-lg">
                    <X size={14} /> Limpar
                </button>
            )}
        </div>
    );
}

