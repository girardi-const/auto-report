'use client';

import { useState } from "react";
import { formatPhoneNumber } from "@/utils";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";

type Props = {
    name: string;
    email: string;
    password: string;
    telephone: string;
    submitting: boolean;
    onChange: (field: string, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
};

export function CreateUserForm({
    name,
    email,
    password,
    telephone,
    submitting,
    onChange,
    onSubmit
}: Props) {
    const [showPassword, setShowPassword] = useState(false);

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
                    type="text"
                    placeholder="Telefone"
                    value={telephone}
                    onChange={(e) => {
                        onChange("telephone", formatPhoneNumber(e.target.value))
                    }}
                    required
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300 text-sm"
                />
                <div className="flex-1 relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha (mín. 6 caracteres)"
                        value={password}
                        onChange={(e) => onChange("password", e.target.value)}
                        required
                        minLength={6}
                        disabled={submitting}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300 text-sm pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
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