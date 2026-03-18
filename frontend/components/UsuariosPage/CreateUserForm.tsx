'use client';

import { Loader2, UserPlus } from "lucide-react";

type Props = {
    name: string;
    email: string;
    password: string;
    submitting: boolean;
    onChange: (field: string, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
};

export function CreateUserForm({
    name,
    email,
    password,
    submitting,
    onChange,
    onSubmit
}: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserPlus size={16} />
                Novo Usuário
            </h2>
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => onChange("name", e.target.value)}
                    required
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300 text-sm"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => onChange("email", e.target.value)}
                    required
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300 text-sm"
                />
                <input
                    type="password"
                    placeholder="Senha (mín. 6 caracteres)"
                    value={password}
                    onChange={(e) => onChange("password", e.target.value)}
                    required
                    minLength={6}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300 text-sm"
                />
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-primary hover:bg-[#c91e25] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest whitespace-nowrap"
                >
                    {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                        'Criar'
                    )}
                </button>
            </form>
        </div>
    );
}