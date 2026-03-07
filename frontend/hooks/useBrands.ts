import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface Brand {
    _id: string;
    brand_name: string;
}

// ─── Client-side module-level cache (per browser session) ─────────────────
// Mirrors the same pattern as useProducts — the first mount fetches from the
// API; every subsequent mount within the same session uses the in-memory copy.
// The server-side cache (5-min TTL) ensures the API itself rarely hits MongoDB.
let cachedBrands: Brand[] | null = null;
let fetchPromise: Promise<Brand[]> | null = null;

async function fetchBrandsOnce(): Promise<Brand[]> {
    if (cachedBrands) return cachedBrands;

    // Deduplicate concurrent fetches (React Strict-Mode double-invoke safe)
    if (!fetchPromise) {
        fetchPromise = fetch(`${API_BASE_URL}/brands`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                const raw: unknown[] = json?.data ?? [];
                const brands: Brand[] = raw.map((b: any) =>
                    typeof b === "string" ? { _id: b, brand_name: b } : b
                );
                cachedBrands = brands;
                return brands;
            })
            .finally(() => {
                fetchPromise = null;
            });
    }

    return fetchPromise;
}
// ─────────────────────────────────────────────────────────────────────────────

export function useBrands() {
    const [brands, setBrands] = useState<Brand[]>(cachedBrands ?? []);
    const [loading, setLoading] = useState(cachedBrands === null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (cachedBrands) {
            setBrands(cachedBrands);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchBrandsOnce()
            .then(setBrands)
            .catch((err) => {
                console.error("Failed to fetch brands:", err);
                setError(err instanceof Error ? err : new Error("Failed to fetch brands"));
            })
            .finally(() => setLoading(false));
    }, []);

    const brandNames = brands.map((b) => b.brand_name);

    return { brands, brandNames, loading, error };
}
