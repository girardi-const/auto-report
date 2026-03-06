'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface FirebaseUser {
    uid: string;
    email: string | null;
    disabled: boolean;
    admin: boolean;
    createdAt: string | null;
    lastSignIn: string | null;
}

interface UseUsersReturn {
    users: FirebaseUser[];
    loading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    createUser: (email: string, password: string) => Promise<boolean>;
    deleteUser: (uid: string) => Promise<boolean>;
    toggleAdmin: (uid: string, admin: boolean) => Promise<boolean>;
}

export function useUsers(): UseUsersReturn {
    const { getIdToken } = useAuth();
    const [users, setUsers] = useState<FirebaseUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authHeaders = async () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getIdToken()}`,
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/users`, {
                headers: await authHeaders(),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao carregar usuários');
            }
            const data = await res.json();
            setUsers(data.data ?? []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [getIdToken]);

    const createUser = useCallback(
        async (email: string, password: string): Promise<boolean> => {
            try {
                const res = await fetch(`${API}/users`, {
                    method: 'POST',
                    headers: await authHeaders(),
                    body: JSON.stringify({ email, password }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error?.message || 'Erro ao criar usuário');
                }
                await fetchUsers();
                return true;
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
                return false;
            }
        },
        [getIdToken, fetchUsers]
    );

    const deleteUser = useCallback(
        async (uid: string): Promise<boolean> => {
            try {
                const res = await fetch(`${API}/users/${uid}`, {
                    method: 'DELETE',
                    headers: await authHeaders(),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error?.message || 'Erro ao deletar usuário');
                }
                await fetchUsers();
                return true;
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
                return false;
            }
        },
        [getIdToken, fetchUsers]
    );

    const toggleAdmin = useCallback(
        async (uid: string, admin: boolean): Promise<boolean> => {
            try {
                const res = await fetch(`${API}/users/${uid}/role`, {
                    method: 'PATCH',
                    headers: await authHeaders(),
                    body: JSON.stringify({ admin }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error?.message || 'Erro ao alterar permissão');
                }
                await fetchUsers();
                return true;
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
                return false;
            }
        },
        [getIdToken, fetchUsers]
    );

    return { users, loading, error, fetchUsers, createUser, deleteUser, toggleAdmin };
}
