import { FileSpreadsheet, FileText, Loader2, Save } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

interface FloatingActionBarProps {
    subtotalBeforeCash: number;
    totalValue: number;
    isGeneratingExcel: boolean;
    isGeneratingPDF: boolean;
    isSaving: boolean;
    hasSections: boolean;
    onGenerateExcel: () => void;
    onGeneratePDF: () => void;
    onSave: () => void;
}

export function FloatingActionBar({
    subtotalBeforeCash,
    totalValue,
    isGeneratingExcel,
    isGeneratingPDF,
    isSaving,
    hasSections,
    onGenerateExcel,
    onGeneratePDF,
    onSave,
}: FloatingActionBarProps) {
    return (
        <div className="sticky bottom-8 mt-12 bg-secondary rounded-full p-3 pl-12 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white ring-8 ring-white/80 backdrop-blur-sm">
            <div className="flex gap-12 items-center">
                <div className="flex flex-col leading-none">
                    <span className="text-[9px] uppercase text-white/40 font-black tracking-[0.4em] mb-1">Total a Prazo</span>
                    <span className="text-xl font-black italic tracking-tighter text-white/80">
                        {formatCurrency(subtotalBeforeCash)}
                    </span>
                </div>
                <div className="w-[1px] h-8 bg-white/10"></div>
                <div className="flex flex-col leading-none">
                    <span className="text-[9px] uppercase text-white font-black tracking-[0.4em] mb-1">Total à Vista</span>
                    <span className="text-3xl font-black italic tracking-tighter text-white">
                        {formatCurrency(totalValue)}
                    </span>
                </div>
            </div>
            <div className="flex gap-3">
                {/* Salvar */}
                <button
                    onClick={onSave}
                    disabled={isSaving || !hasSections}
                    className="bg-white/10 text-white font-black px-8 py-4 rounded-full hover:bg-white/20 hover:text-white transition-all flex items-center gap-3 uppercase text-xs tracking-[0.1em] shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" /> Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={18} /> Salvar
                        </>
                    )}
                </button>

                {/* Excel */}
                <button
                    onClick={onGenerateExcel}
                    disabled={isGeneratingExcel || !hasSections}
                    className="bg-white/10 text-white font-black px-8 py-4 rounded-full hover:bg-green-500 hover:text-white transition-all flex items-center gap-3 uppercase text-xs tracking-[0.1em] shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                    {isGeneratingExcel ? (
                        <>
                            <Loader2 size={18} className="animate-spin" /> Gerando...
                        </>
                    ) : (
                        <>
                            <FileSpreadsheet size={18} /> Gerar Excel
                        </>
                    )}
                </button>

                {/* PDF */}
                <button
                    onClick={onGeneratePDF}
                    disabled={isGeneratingPDF || !hasSections}
                    className="bg-white text-secondary font-black px-12 py-4 rounded-full hover:bg-primary hover:text-white transition-all flex items-center gap-3 uppercase text-xs tracking-[0.1em] shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGeneratingPDF ? (
                        <>
                            <Loader2 size={18} className="animate-spin" /> Gerando...
                        </>
                    ) : (
                        <>
                            <FileText size={18} /> Gerar PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
