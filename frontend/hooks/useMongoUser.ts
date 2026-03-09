'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface MongoUser {
    uid: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

export function useMongoUser() {
    const { user: firebaseUser, getIdToken } = useAuth();
    const [mongoUser, setMongoUser] = useState<MongoUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsName, setNeedsName] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMe = useCallback(async () => {
        if (!firebaseUser) {
            setMongoUser(null);
            setNeedsName(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getIdToken();
            const res = await fetch(`${API}/users/me`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 404) {
                // User is in Firebase but not in Mongo
                setNeedsName(true);
                setMongoUser(null);
            } else if (res.ok) {
                const data = await res.json();
                setMongoUser(data.data);
                setNeedsName(false);
            } else {
                const errData = await res.json();
                throw new Error(errData.error?.message || 'Erro ao carregar seu perfil');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [firebaseUser, getIdToken]);

    const createMe = useCallback(async (name: string) => {
        if (!firebaseUser) return false;
        setLoading(true);
        setError(null);

        try {
            const token = await getIdToken();
            const res = await fetch(`${API}/users/me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                const data = await res.json();
                setMongoUser(data.data);
                setNeedsName(false);
                return true;
            } else {
                const errData = await res.json();
                throw new Error(errData.error?.message || 'Erro ao salvar perfil');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro desconhecido');
            return false;
        } finally {
            setLoading(false);
        }
    }, [firebaseUser, getIdToken]);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    return { mongoUser, loading, error, needsName, createMe, refresh: fetchMe };
}
