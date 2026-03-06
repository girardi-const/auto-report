import { useState, useEffect, useRef } from 'react';
import { CatalogProduct } from '../types';

interface UseProductsReturn {
    products: CatalogProduct[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// Module-level cache: one fetch shared across any hook instance in the same session
let cachedProducts: CatalogProduct[] | null = null;
let fetchPromise: Promise<CatalogProduct[]> | null = null;

async function fetchProducts(): Promise<CatalogProduct[]> {
    if (cachedProducts) return cachedProducts;

    // Deduplicate concurrent fetches (React Strict-Mode double-invoke safe)
    if (!fetchPromise) {
        fetchPromise = fetch(`${API_URL}/products`, {
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                const data: CatalogProduct[] = json?.data ?? json ?? [];
                cachedProducts = data;
                return data;
            })
            .finally(() => {
                fetchPromise = null;
            });
    }

    return fetchPromise;
}

export function useProducts(): UseProductsReturn {
    const [products, setProducts] = useState<CatalogProduct[]>(cachedProducts ?? []);
    const [loading, setLoading] = useState<boolean>(cachedProducts === null);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const load = () => {
        // Already cached — no spinner flash
        if (cachedProducts) {
            setProducts(cachedProducts);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        fetchProducts()
            .then(setProducts)
            .catch((err: Error) => {
                if (err.name !== 'AbortError') {
                    setError(err.message ?? 'Erro ao carregar produtos');
                }
            })
            .finally(() => setLoading(false));
    };

    const refetch = () => {
        cachedProducts = null; // bust cache
        load();
    };

    useEffect(() => {
        load();
        return () => {
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { products, loading, error, refetch };
}
