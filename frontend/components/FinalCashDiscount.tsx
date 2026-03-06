export const FinalCashDiscount = ({ value, onChange, economy }: { value: number, onChange: (v: number) => void, economy: string }) => (
    <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 flex  flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Condição Especial</span>
            <h3 className="text-slate-800 font-bold text-sm">Desconto para Pagamento à Vista</h3>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
                <label className="text-[9px] font-black text-gray-400 mb-1 uppercase text-center">Desconto (%)</label>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-20 bg-white border-2 border-red-100 rounded-lg px-2 py-1 focus:border-red-500 outline-none text-center font-bold text-red-600"
                />
            </div>
            <div className="text-right">
                <span className="text-[9px] font-black text-gray-400 block uppercase">Economia Real</span>
                <span className="text-red-600 font-black text-lg">{economy}</span>
            </div>
        </div>
    </div>
)