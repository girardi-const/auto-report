import { Shield, ShieldOff, Trash2 } from "lucide-react";
import { FirebaseUser } from "@/hooks/useUsers";

type Props = {
    user: FirebaseUser;
    confirmDelete: string | null;
    setConfirmDelete: (id: string | null) => void;
    onDelete: (uid: string) => void;
    onToggle: (user: FirebaseUser) => void;
};

export function UserItem({
    user,
    confirmDelete,
    setConfirmDelete,
    onDelete,
    onToggle
}: Props) {
    return (
        <div
            key={user.uid}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <p className="text-md font-bold text-gray-800 truncate">
                    {user.name}
                </p>
                <p className="text-sm text-secondary truncate mt-0.5">
                    {user.email}
                </p>
                <p className="text-sm text-secondary truncate mt-0.5">
                    {user.telephone}
                </p>
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">
                    Criado em{' '}
                    {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {/* Role badge */}
                <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${user.admin
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    {user.admin ? 'Admin' : 'Usuário'}
                </span>

                {/* Toggle admin */}
                <button
                    onClick={() => onToggle(user)}
                    title={user.admin ? 'Remover admin' : 'Tornar admin'}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                >
                    {user.admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                </button>

                {/* Delete */}
                {confirmDelete === user.uid ? (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onDelete(user.uid)}
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
                        onClick={() => setConfirmDelete(user.uid)}
                        title="Deletar usuário"
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}