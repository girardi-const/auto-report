import { formatPriceInput } from '../utils/formatters';

export const DeliveryFeeInput = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        onChange(Number(rawValue) / 100);
    };

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Logística</span>
                <h3 className="text-slate-800 font-bold text-sm">Taxa de Entrega</h3>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                    <label className="text-[9px] font-black text-gray-400 mb-1 uppercase text-center">Valor (R$)</label>
                    <input
                        type="text"
                        value={value === 0 ? '' : formatPriceInput(value.toFixed(2).replace('.', ''))}
                        onChange={handleInputChange}
                        className="w-32 bg-white border-2 border-slate-200 rounded-lg px-2 py-1 focus:border-slate-500 outline-none text-right font-bold text-slate-700"
                        placeholder="0,00"
                    />
                </div>
            </div>
        </div>
    );
};
