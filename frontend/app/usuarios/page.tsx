'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useUsers, FirebaseUser } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { Shield, ShieldOff, Trash2, UserPlus, Loader2 } from 'lucide-react';
import OtpModal from '@/components/OtpModal';
import { CreateUserForm } from '@/components/UsuariosPage/CreateUserForm';
import { UsersList } from '@/components/UsuariosPage/UserList';

export default function UsersPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { users, loading, error, fetchUsers, createUser, deleteUser, toggleAdmin } = useUsers();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telephone, setTelephone] = useState('')
    const [name, setName] = useState('');
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
        const ok = await createUser(email, password, name, telephone);
        if (ok) {
            toast.success('Usuário criado com sucesso!');
            setEmail('');
            setPassword('');
            setName('');
            setTelephone('');
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
        <div className="min-h-screen bg-muted">
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="px-6 py-6">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-gray-800 font-black text-2xl tracking-tight uppercase">
                        Gerenciar Usuários
                    </h1>
                    <p className="text-gray-800/40 text-xs font-medium mt-0.5">
                        Crie, edite permissões ou remova contas de acesso ao sistema.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 flex flex-col gap-5">

                <CreateUserForm
                    name={name}
                    email={email}
                    password={password}
                    telephone={telephone}
                    submitting={submitting}
                    onChange={(field, value) => {
                        if (field === "name") setName(value);
                        if (field === "email") setEmail(value);
                        if (field === "password") setPassword(value);
                        if (field === "telephone") setTelephone(value);
                    }}
                    onSubmit={handleCreate}
                />

                <UsersList
                    users={users}
                    loading={loading}
                    confirmDelete={confirmDelete}
                    setConfirmDelete={setConfirmDelete}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                />

                {error && (
                    <div className="bg-red-50 border-l-4 border-primary text-red-800 px-4 py-3 rounded-md text-sm font-medium">
                        {error}
                    </div>
                )}
            </div>

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
