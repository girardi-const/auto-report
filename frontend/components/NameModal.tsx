import { useState, FormEvent } from 'react';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface NameModalProps {
    open: boolean;
    onSubmit: (name: string) => Promise<boolean>;
    loading: boolean;
}

export default function NameModal({ open, onSubmit, loading }: NameModalProps) {
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        const ok = await onSubmit(name.trim());
        if (ok) {
            toast.success('Perfil atualizado com sucesso!');
        } else {
            toast.error('Erro ao salvar nome. Tente novamente.');
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <User className="text-primary w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Bem-vindo ao Portal Girardi!
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Para continuar, por favor, insira o seu nome completo. Isso nos ajudará a identificar quem criou cada relatório.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Seu Nome
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                required
                                disabled={submitting || loading}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || submitting || loading}
                            className="w-full relative px-6 py-3 bg-primary hover:bg-[#c91e25] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest overflow-hidden"
                        >
                            {(submitting || loading) ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                "Salvar e Continuar"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
