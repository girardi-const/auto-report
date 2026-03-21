import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface Brand {
    _id: string;
    brand_name: string;
    productCount?: number;
}

// ─── Client-side module-level cache (per browser session) ─────────────────
// Mirrors the same pattern as useProducts — the first mount fetches from the
// API; every subsequent mount within the same session uses the in-memory copy.
// The server-side cache (5-min TTL) ensures the API itself rarely hits MongoDB.
let cachedBrands: Brand[] | null = null;
let fetchPromise: Promise<Brand[]> | null = null;

async function fetchBrandsOnce(force: boolean = false): Promise<Brand[]> {
    if (cachedBrands && !force) return cachedBrands;

    // Deduplicate concurrent fetches (React Strict-Mode double-invoke safe)
    if (!fetchPromise || force) {
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
    const { getIdToken } = useAuth();
    const [brands, setBrands] = useState<Brand[]>(cachedBrands ?? []);
    const [loading, setLoading] = useState(cachedBrands === null);
    const [error, setError] = useState<Error | null>(null);

    const fetchBrands = (force: boolean = false) => {
        if (!force && cachedBrands) {
            setBrands(cachedBrands);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchBrandsOnce(force)
            .then(setBrands)
            .catch((err) => {
                console.error("Failed to fetch brands:", err);
                setError(err instanceof Error ? err : new Error("Failed to fetch brands"));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const brandNames = brands.map((b) => b.brand_name);

    const createBrand = async (brandName: string): Promise<Brand> => {
        try {
            const token = await getIdToken();
            const response = await fetch(`${API_BASE_URL}/brands`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ brand_name: brandName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const json = await response.json();
            const newBrand: Brand = json.data;

            // Update cache and state
            if (cachedBrands) {
                cachedBrands = [...cachedBrands, newBrand].sort((a, b) => 
                    a.brand_name.localeCompare(b.brand_name)
                );
            } else {
                cachedBrands = [newBrand];
            }
            setBrands(cachedBrands);

            return newBrand;
        } catch (err) {
            console.error("Failed to create brand:", err);
            throw err;
        }
    };

    const deleteBrand = async (brandId: string): Promise<{ deletedBrand: string; deletedProductsCount: number }> => {
        try {
            const token = await getIdToken();
            const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const json = await response.json();

            // Update cache and state
            if (cachedBrands) {
                cachedBrands = cachedBrands.filter((b) => b._id !== brandId);
            }
            setBrands(cachedBrands ?? []);

            return json.data;
        } catch (err) {
            console.error("Failed to delete brand:", err);
            throw err;
        }
    };

    return { 
        brands, 
        brandNames, 
        loading, 
        error, 
        refreshBrands: () => fetchBrands(true),
        createBrand,
        deleteBrand 
    };
}
