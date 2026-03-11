'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface ImportError {
    productCode?: string;
    reason: string;
}

export interface ImportSummary {
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: ImportError[];
}

export interface ImportProgress {
    processed: number;
    total: number;
    percent: number;
}

export interface ImportDoc {
    _id: string;
    filename: string;
    fileType: 'csv' | 'xlsx' | 'pdf';
    status: 'processing' | 'done' | 'failed';
    createdBy: string;
    summary: ImportSummary;
    progress: ImportProgress;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ImportsResponse {
    imports: ImportDoc[];
    total: number;
    page: number;
    totalPages: number;
}

export function useImports() {
    const { getIdToken } = useAuth();
    const [importsData, setImportsData] = useState<ImportsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = async (includeContentType = true) => {
        const token = await getIdToken();
        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    };

    const fetchImports = useCallback(
        async (page = 1, limit = 10, includeDeleted = false) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `${API}/admin/imports?page=${page}&limit=${limit}&includeDeleted=${includeDeleted}`,
                    { headers: await getHeaders() }
                );
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error?.message || 'Erro ao carregar importações');
                }
                const data = await res.json();
                setImportsData(data.data as ImportsResponse);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
            } finally {
                setLoading(false);
            }
        },
        [getIdToken]
    );

    const uploadImport = useCallback(
        async (file: File): Promise<ImportDoc | null> => {
            setLoading(true);
            setError(null);
            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch(`${API}/admin/imports/upload`, {
                    method: 'POST',
                    // Do not set Content-Type, let the browser set it with boundary for FormData
                    headers: await getHeaders(false),
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error?.message || 'Erro ao fazer upload');
                }
                const data = await res.json();
                return data.data as ImportDoc;
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [getIdToken]
    );

    const getImportById = useCallback(
        async (id: string): Promise<ImportDoc | null> => {
            try {
                const res = await fetch(`${API}/admin/imports/${id}`, {
                    headers: await getHeaders(),
                });
                if (!res.ok) {
                    throw new Error('Erro ao buscar importação por ID');
                }
                const data = await res.json();
                return data.data as ImportDoc;
            } catch (err: unknown) {
                console.error(err);
                return null;
            }
        },
        [getIdToken]
    );

    const deleteImport = useCallback(
        async (id: string, mode: 'full' | 'file-only'): Promise<boolean> => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API}/admin/imports/${id}?mode=${mode}`, {
                    method: 'DELETE',
                    headers: await getHeaders(),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error?.message || 'Erro ao deletar importação');
                }
                return true;
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
                return false;
            } finally {
                setLoading(false);
            }
        },
        [getIdToken]
    );

    const getImportBackups = useCallback(
        async (id: string): Promise<any[]> => {
            try {
                const res = await fetch(`${API}/admin/imports/${id}/backups`, {
                    headers: await getHeaders(),
                });
                if (!res.ok) {
                    throw new Error('Erro ao buscar backups');
                }
                const data = await res.json();
                return data.data || [];
            } catch (err: unknown) {
                console.error(err);
                return [];
            }
        },
        [getIdToken]
    );

    return {
        importsData,
        loading,
        error,
        fetchImports,
        uploadImport,
        getImportById,
        deleteImport,
        getImportBackups,
    };
}
