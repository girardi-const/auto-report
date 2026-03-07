'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';

export default function CustomSignIn() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
        } catch (err: any) {
            console.error('Error:', err);

            // Handle Firebase error messages
            if (err.code === 'auth/user-not-found') {
                setError('Email não encontrado.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Senha incorreta.');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Credenciais inválidas.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Muitas tentativas. Tente novamente mais tarde.');
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Erro ao fazer login. Verifique suas credenciais.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-[420px] mx-auto z-10">
                {/* Modern Glassmorphic Card */}
                <div className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-8 sm:p-10 transition-all duration-500 overflow-hidden relative">

                    {/* Subtle internal gradient for depth */}
                    <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="text-center mb-10 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-rose-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-6">
                            <LogIn className="text-white" size={28} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black text-[#403e3d] tracking-tight mb-2">
                            Acesso ao Sistema
                        </h1>
                        <p className="text-[#403e3d]/60 text-sm font-medium">
                            Entre com suas credenciais para continuar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={18} className="shrink-0 text-red-500" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-bold text-[#403e3d]/80 uppercase tracking-wider ml-1"
                                >
                                    E-mail
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#403e3d]/40 group-focus-within:text-primary transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="block w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 text-[#403e3d] text-sm rounded-2xl focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all duration-300 placeholder:text-[#403e3d]/30 font-medium shadow-sm hover:bg-white/70"
                                        placeholder="seu@email.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-bold text-[#403e3d]/80 uppercase tracking-wider ml-1"
                                >
                                    Senha
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#403e3d]/40 group-focus-within:text-primary transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="block w-full pl-11 pr-12 py-3.5 bg-white/50 border border-white/60 text-[#403e3d] text-sm rounded-2xl focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all duration-300 placeholder:text-[#403e3d]/30 font-medium shadow-sm hover:bg-white/70"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#403e3d]/40 hover:text-[#403e3d] transition-colors focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-[#b01a20] active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_-8px_rgba(201,30,37,0.6)] hover:shadow-[0_12px_24px_-8px_rgba(201,30,37,0.7)] transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-sm relative overflow-hidden group"
                        >
                            {/* Button shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

                            {loading ? (
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                    <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></span>
                                    <span>Entrando...</span>
                                </span>
                            ) : (
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Entrar no Sistema
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
