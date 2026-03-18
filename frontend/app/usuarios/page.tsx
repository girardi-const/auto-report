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
        const ok = await createUser(email, password, name);
        if (ok) {
            toast.success('Usuário criado com sucesso!');
            setEmail('');
            setPassword('');
            setName('');
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

            <CreateUserForm
                name={name}
                email={email}
                password={password}
                submitting={submitting}
                onChange={(field, value) => {
                    if (field === "name") setName(value);
                    if (field === "email") setEmail(value);
                    if (field === "password") setPassword(value);
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
