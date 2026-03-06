import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface Brand {
    _id: string;
    brand_name: string;
}

export function useBrands() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchBrands = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/brands`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setBrands(json.data);
                } else {
                    // Handle case where it might be a simple array or different structure
                    const names: Brand[] = (json.data ?? []).map((b: any) =>
                        typeof b === 'string' ? { _id: b, brand_name: b } : b
                    );
                    setBrands(names);
                }
            } catch (err) {
                console.error("Failed to fetch brands:", err);
                setError(err instanceof Error ? err : new Error("Failed to fetch brands"));
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    const brandNames = brands.map(b => b.brand_name);

    return { brands, brandNames, loading, error };
}
