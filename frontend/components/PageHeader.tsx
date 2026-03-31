import { RotateCcw } from "lucide-react";

const PageHeader = ({ onClear, title = "Gerar Novo Relatório", subtitle = "Preencha os dados abaixo para gerar o PDF." }: { onClear: () => void, title?: string, subtitle?: string }) => {
    return (
        <div className="flex justify-between items-end border-b border-gray-200 pb-4 px-20">
            <div>
                <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">{title}</h2>
                <p className="text-gray-400 text-sm font-medium">{subtitle}</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onClear}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-all text-xs font-bold uppercase tracking-widest text-gray-400"
                >
                    <RotateCcw size={14} /> Limpar
                </button>
            </div>
        </div>
    );
};

export default PageHeader;
