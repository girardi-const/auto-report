'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useUsers, FirebaseUser } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { Shield, ShieldOff, Trash2, UserPlus, Loader2 } from 'lucide-react';
import OtpModal from '@/components/OtpModal';

export default function UsersPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { users, loading, error, fetchUsers, createUser, deleteUser, toggleAdmin } = useUsers();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Confirmation state
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // OTP modal state for toggle admin
    const [pendingToggle, setPendingToggle] = useState<FirebaseUser | null>(null);

    // Guard: admin only
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    // Fetch on mount
    useEffect(() => {
        if (isAdmin) fetchUsers();
    }, [isAdmin]);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const ok = await createUser(email, password);
        if (ok) {
            toast.success('Usuário criado com sucesso!');
            setEmail('');
            setPassword('');
        } else {
            toast.error(error || 'Erro ao criar usuário');
        }
        setSubmitting(false);
    };

    const handleDelete = async (uid: string) => {
        const ok = await deleteUser(uid);
        if (ok) {
            toast.success('Usuário deletado');
        } else {
            toast.error(error || 'Erro ao deletar');
        }
        setConfirmDelete(null);
    };

    const handleToggle = (u: FirebaseUser) => {
        setPendingToggle(u);
    };

    const confirmToggle = async () => {
        if (!pendingToggle) return;
        const newAdmin = !pendingToggle.admin;
        const ok = await toggleAdmin(pendingToggle.uid, newAdmin);
        if (ok) {
            toast.success(newAdmin ? 'Promovido a admin' : 'Admin removido');
        } else {
            toast.error(error || 'Erro ao alterar permissão');
        }
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-bold text-secondary">Gerenciar Usuários</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Crie, edite permissões ou remova contas de acesso ao sistema.
                </p>
            </div>

            {/* Create user card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserPlus size={16} />
                    Novo Usuário
                </h2>
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder:text-gray-300 text-sm"
                    />
                    <input
                        type="password"
                        placeholder="Senha (mín. 6 caracteres)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

            {/* Users list */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-secondary uppercase tracking-widest">
                        Usuários Cadastrados ({users.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center text-gray-400 py-12 text-sm">
                        Nenhum usuário encontrado.
                    </p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {users.map((u) => (
                            <div
                                key={u.uid}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {u.email}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Criado em{' '}
                                        {u.createdAt
                                            ? new Date(u.createdAt).toLocaleDateString('pt-BR')
                                            : '—'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Role badge */}
                                    <span
                                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${u.admin
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {u.admin ? 'Admin' : 'Usuário'}
                                    </span>

                                    {/* Toggle admin */}
                                    <button
                                        onClick={() => handleToggle(u)}
                                        title={u.admin ? 'Remover admin' : 'Tornar admin'}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                                    >
                                        {u.admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                                    </button>

                                    {/* Delete */}
                                    {confirmDelete === u.uid ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(u.uid)}
                                                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete(u.uid)}
                                            title="Deletar usuário"
                                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-primary text-red-800 px-4 py-3 rounded-md text-sm font-medium">
                    {error}
                </div>
            )}

            {/* OTP Modal for admin toggle */}
            <OtpModal
                open={!!pendingToggle}
                onClose={() => setPendingToggle(null)}
                onConfirm={confirmToggle}
                title={pendingToggle?.admin ? 'Remover Admin' : 'Tornar Admin'}
                description={`Confirme o token para ${pendingToggle?.admin ? 'remover' : 'conceder'} privilégios de administrador para ${pendingToggle?.email ?? 'este usuário'}.`}
            />
        </div>
    );
}
