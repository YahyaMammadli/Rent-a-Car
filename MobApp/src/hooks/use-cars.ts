import { Car } from "@/types/car.type";
import { PagedResult } from "@/types/api.types";
import { apiFetch, errorMessage, readError } from "@/utils/api-client";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

type Params = { brand?: string; search?: string };

export function useCars({ brand = "", search = "" }: Params) {
    const [items, setItems] = useState<Car[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // защита от гонок: ответ устаревшего запроса (смена бренда/поиска) игнорируется
    const requestId = useRef(0);

    const fetchPage = useCallback(
        async (pageNumber: number) => {
            const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(PAGE_SIZE) });
            if (brand) params.set("brand", brand);
            if (search.trim()) params.set("search", search.trim());

            const res = await apiFetch(`/api/cars?${params.toString()}`);
            if (!res.ok) throw await readError(res);
            return (await res.json()) as PagedResult<Car>;
        },
        [brand, search],
    );

    const load = useCallback(
        async (mode: "initial" | "refresh") => {
            const id = ++requestId.current;
            if (mode === "initial") setLoading(true);
            else setRefreshing(true);

            try {
                const data = await fetchPage(1);
                if (id !== requestId.current) return;
                setItems(data.items);
                setTotal(data.totalCount);
                setPage(1);
                setError(null);
            } catch (e) {
                if (id !== requestId.current) return;
                setError(errorMessage(e, "Could not load cars"));
            } finally {
                if (id === requestId.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [fetchPage],
    );

    useEffect(() => {
        load("initial");
    }, [load]);

    const loadMore = useCallback(async () => {
        if (loading || refreshing || loadingMore || items.length >= total) return;

        const id = requestId.current;
        setLoadingMore(true);
        try {
            const data = await fetchPage(page + 1);
            if (id !== requestId.current) return;
            setItems((prev) => [...prev, ...data.items]);
            setPage(page + 1);
        } catch {
            // страница не догрузилась — пользователь может потянуть вниз ещё раз
        } finally {
            setLoadingMore(false);
        }
    }, [fetchPage, items.length, loading, loadingMore, page, refreshing, total]);

    return {
        items,
        loading,
        refreshing,
        loadingMore,
        error,
        refresh: () => load("refresh"),
        reload: () => load("initial"),
        loadMore,
    };
}
