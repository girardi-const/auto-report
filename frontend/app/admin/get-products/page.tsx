'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useBrands } from '@/hooks/useBrands';
import { 
    Loader2, 
    Search, 
    Download, 
    Filter, 
    Calendar, 
    DollarSign, 
    Hash,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    Braces
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function AdminGetProductsPage() {
    const { user, loading: authLoading, isAdmin, getIdToken } = useAuth();
    const router = useRouter();
    const { brands, loading: brandsLoading } = useBrands();

    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [limit, setLimit] = useState<number>(50);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [showBrandsList, setShowBrandsList] = useState(false);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
        if (!authLoading && user && !isAdmin) router.push('/');
    }, [user, authLoading, isAdmin, router]);

    const handleToggleBrand = (brandName: string) => {
        setSelectedBrands(prev => 
            prev.includes(brandName) 
                ? prev.filter(b => b !== brandName) 
                : [...prev, brandName]
        );
    };

    const handleFetchProducts = async () => {
        setLoading(true);
        setResults(null);
        try {
            const token = await getIdToken();
            const params = new URLSearchParams();
            
            if (selectedBrands.length > 0) params.append('brands', selectedBrands.join(','));
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            params.append('limit', limit.toString());
            params.append('page', '1');

            const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch products');

            const data = await response.json();
            setResults(data.data || data);
            toast.success('Produtos recuperados com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao buscar produtos');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!results) return;
        navigator.clipboard.writeText(JSON.stringify(results, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success('JSON copiado para a área de transferência!');
    };

    const downloadJson = () => {
        if (!results) return;
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (authLoading || !user || !isAdmin) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-10 shadow-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-primary/10 p-2 rounded-xl">
                                    <Braces className="text-primary" size={24} />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                    Exportar Produtos
                                </h1>
                            </div>
                            <p className="text-slate-500 font-medium">
                                Configure filtros avançados e obtenha o JSON dos produtos
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Filters */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-2 mb-6">
                            <Filter size={18} className="text-primary" />
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Filtros</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Brand Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    Marcas ({selectedBrands.length})
                                </label>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowBrandsList(!showBrandsList)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-slate-100 transition-all text-sm font-bold text-slate-700"
                                    >
                                        <span className="truncate">
                                            {selectedBrands.length === 0 
                                                ? 'Todas as marcas' 
                                                : selectedBrands.length === 1 
                                                    ? selectedBrands[0] 
                                                    : `${selectedBrands.length} marcas selecionadas`}
                                        </span>
                                        {showBrandsList ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                    </button>
                                    
                                    {showBrandsList && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {brandsLoading ? (
                                                <div className="px-4 py-8 flex justify-center">
                                                    <Loader2 size={20} className="animate-spin text-slate-300" />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-1">
                                                    {brands.map((brand) => (
                                                        <button
                                                            key={brand._id}
                                                            onClick={() => handleToggleBrand(brand.brand_name)}
                                                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                                                selectedBrands.includes(brand.brand_name)
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'hover:bg-slate-50 text-slate-600'
                                                            }`}
                                                        >
                                                            <span className="uppercase tracking-wide">{brand.brand_name}</span>
                                                            {selectedBrands.includes(brand.brand_name) && <CheckCircle2 size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedBrands.length > 0 && (
                                    <button 
                                        onClick={() => setSelectedBrands([])}
                                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest mt-1"
                                    >
                                        Limpar seleção
                                    </button>
                                )}
                            </div>

                            {/* Price Range */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <DollarSign size={12} /> Faixa de Preço
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="number" 
                                        placeholder="Min" 
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Max" 
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Calendar size={12} /> Data de Atualização
                                </label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[8px] font-black uppercase">Início</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[8px] font-black uppercase">Fim</span>
                                    </div>
                                </div>
                            </div>

                            {/* Limit */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Hash size={12} /> Limite de Resultados
                                </label>
                                <input 
                                    type="number" 
                                    value={limit}
                                    onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <button 
                                onClick={handleFetchProducts}
                                disabled={loading}
                                className="w-full bg-primary text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Search size={20} className="group-hover:scale-110 transition-transform" />
                                        Buscar Produtos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Results Area */}
                <div className="lg:col-span-8 flex flex-col min-h-[600px]">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col flex-1 overflow-hidden">
                        
                        {/* Results Header */}
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dataset Output</h3>
                            </div>
                            
                            {results && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={copyToClipboard}
                                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
                                        title="Copiar JSON"
                                    >
                                        {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        {isCopied ? 'Copiado' : 'Copiar'}
                                    </button>
                                    <button 
                                        onClick={downloadJson}
                                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
                                        title="Baixar JSON"
                                    >
                                        <Download size={14} />
                                        Baixar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Code Editor / Visualizer */}
                        <div className="flex-1 p-8 font-mono bg-slate-900 overflow-auto relative group">
                            {!results && !loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-4">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                                        <LayoutGrid size={32} />
                                    </div>
                                    <p className="font-bold text-sm uppercase tracking-widest text-slate-600">Aguardando busca...</p>
                                </div>
                            )}

                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
                                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                                    <p className="font-black text-white text-xs uppercase tracking-[0.3em] animate-pulse">Compiling Data...</p>
                                </div>
                            )}

                            {results && (
                                <div className="relative">
                                    <div className="absolute -top-4 -right-4 bg-slate-800 px-3 py-1 rounded-bl-xl text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        JSON format · {Array.isArray(results) ? results.length : results.data?.length || 0} products
                                    </div>
                                    <pre className="text-green-400 text-sm leading-relaxed">
                                        {JSON.stringify(results, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats footer if results exist */}
                    {results && (
                        <div className="mt-4 flex gap-4">
                            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                    <Hash size={18}/>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Itens</p>
                                    <p className="text-lg font-black text-slate-800">{Array.isArray(results) ? results.length : results.data?.length || 0}</p>
                                </div>
                            </div>
                            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                                    <CheckCircle2 size={18}/>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                    <p className="text-lg font-black text-slate-800">SUCCESS</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
