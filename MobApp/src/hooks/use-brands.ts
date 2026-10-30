import { CarBrand } from "@/types/car.type";
import { apiJson, errorMessage } from "@/utils/api-client";
import { useCallback, useEffect, useState } from "react";

export function useBrands() {
    const [brands, setBrands] = useState<CarBrand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setBrands(await apiJson<CarBrand[]>("/api/brands"));
            setError(null);
        } catch (e) {
            setError(errorMessage(e, "Could not load brands"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { brands, loading, error, reload: load };
}
