import { useState, useEffect, useRef } from 'react';
import { CatalogProduct } from '../types';

interface UseProductsReturn {
    products: CatalogProduct[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

interface UseProductsOptions {
    page?: number;
    limit?: number;
    search?: string;
    brand?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// We no longer use a global in-memory product cache.
// Caching can be handled by swr, react-query, or simply kept localized to the hook.

export function useProducts({ page = 1, limit = 50, search = '', brand = '' }: UseProductsOptions = {}): UseProductsReturn {
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);

        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            ...(search && { search }),
            ...(brand && { brand }),
        });

        fetch(`${API_URL}/products?${params.toString()}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: abortRef.current.signal,
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                const data = json.data?.data ?? json.data ?? [];
                setProducts(data);
                setTotal(json.data?.total ?? data.length);
                setTotalPages(json.data?.totalPages ?? 1);
            })
            .catch((err: Error) => {
                if (err.name !== 'AbortError') {
                    setError(err.message ?? 'Erro ao carregar produtos');
                }
            })
            .finally(() => setLoading(false));
    };

    const refetch = () => {
        load();
    };

    useEffect(() => {
        load();
        return () => {
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, search, brand]);

    return { products, total, page, totalPages, loading, error, refetch };
}
