'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface BrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (brandName: string) => Promise<any>;
}

export function BrandModal({ isOpen, onClose, onSubmit }: BrandModalProps) {
    const [brandName, setBrandName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = brandName.trim();
        if (!trimmedName) return;

        setIsSubmitting(true);
        try {
            await onSubmit(trimmedName);
            toast.success('Marca criada com sucesso!');
            setBrandName('');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar marca');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-secondary p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black italic shadow-lg">
                            B
                        </div>
                        <h2 className="text-white font-bold uppercase tracking-tight">Nova Marca</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">
                            Nome da Marca
                        </label>
                        <input
                            required
                            autoFocus
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value.toUpperCase())}
                            placeholder="EX: DECA"
                            disabled={isSubmitting}
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-4 focus:border-primary focus:bg-white outline-none font-bold uppercase"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-colors uppercase text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !brandName.trim()}
                            className="bg-secondary text-white font-black px-8 py-3 rounded-xl hover:bg-primary transition-all flex items-center gap-2 uppercase text-xs shadow-lg disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Plus size={16} />
                            )}
                            Criar Marca
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
