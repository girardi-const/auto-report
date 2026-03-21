'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Read custom claims to determine admin status
                const tokenResult = await firebaseUser.getIdTokenResult();
                setIsAdmin(tokenResult.claims.admin === true);

                // Set session cookie so the middleware can enforce auth server-side
                document.cookie = '__session=1; path=/; max-age=604800; SameSite=Lax';
            } else {
                setIsAdmin(false);

                // Clear session cookie
                document.cookie = '__session=; path=/; max-age=0';
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Full page reload to ensure auth state + claims are set
            window.location.href = '/';
        } catch (error: any) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            router.push('/sign-in');
        } catch (error: any) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    /**
     * Returns a fresh Firebase ID token for use in Authorization headers.
     * Pass `true` to force-refresh (useful after a role change).
     */
    const getIdToken = async (): Promise<string> => {
        if (!user) throw new Error('Usuário não autenticado');
        return user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signOut, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
