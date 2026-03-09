import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedReport } from '../types';

const API = process.env.NEXT_PUBLIC_API_URL;

export interface ReportQueryOptions {
    page?: number;
    limit?: number;
    search?: string;
    creator_name?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'timestamp' | 'title';
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface UseReportsReturn {
    reports: SavedReport[];
    pagination: PaginationMeta | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useReports(options: ReportQueryOptions = {}): UseReportsReturn {
    const { page = 1, limit = 100, search, creator_name, dateFrom, dateTo, sortBy = 'timestamp', sortOrder = 'desc' } = options;
    const { user, isAdmin, getIdToken } = useAuth();
    const [reports, setReports] = useState<SavedReport[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getIdToken();

            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                sortBy,
                sortOrder,
                ...(search ? { search } : {}),
                ...(creator_name ? { creator_name } : {}),
                ...(dateFrom ? { dateFrom } : {}),
                ...(dateTo ? { dateTo } : {}),
            });

            const res = await fetch(`${API}/reports/${user.uid}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao carregar relatórios');
            }

            const data = await res.json();
            const payload = data.data ?? {};
            setReports(payload.data ?? []);
            setPagination({
                page: payload.page ?? page,
                limit: payload.limit ?? limit,
                total: payload.total ?? 0,
                totalPages: payload.totalPages ?? 1,
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin, getIdToken, page, limit, search, creator_name, dateFrom, dateTo, sortBy, sortOrder]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    return { reports, pagination, loading, error, refetch: fetchReports };
}
