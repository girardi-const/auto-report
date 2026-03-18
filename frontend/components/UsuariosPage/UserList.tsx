import { Loader2 } from "lucide-react";
import { FirebaseUser } from "@/hooks/useUsers";
import { UserItem } from "./UserItem";

type Props = {
    users: FirebaseUser[];
    loading: boolean;
    confirmDelete: string | null;
    setConfirmDelete: (id: string | null) => void;
    onDelete: (uid: string) => void;
    onToggle: (user: FirebaseUser) => void;
};

export function UsersList({
    users,
    loading,
    confirmDelete,
    setConfirmDelete,
    onDelete,
    onToggle
}: Props) {


    return (
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
                        <UserItem
                            key={u.uid}
                            user={u}
                            confirmDelete={confirmDelete}
                            setConfirmDelete={setConfirmDelete}
                            onDelete={onDelete}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}