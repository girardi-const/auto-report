'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomSignIn() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-primary text-red-800 px-4 py-3 rounded-md text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block text-xs font-bold text-secondary uppercase tracking-widest px-1"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300"
                                placeholder="seu@email.com"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-xs font-bold text-secondary uppercase tracking-widest px-1"
                            >
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-[#c91e25] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar no Sistema'
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Girardi Casa & Construção
                </p>
            </div>
        </div>
    );
}
