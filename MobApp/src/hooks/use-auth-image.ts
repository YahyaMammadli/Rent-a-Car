import { apiFetch } from "@/utils/api-client";
import { useEffect, useState } from "react";

// Картинки с защищённых эндпоинтов (аватар, фото прав) нельзя передать в <Image> по URL:
// нужен заголовок Authorization, а токен может обновиться. Поэтому качаем через apiFetch
// и отдаём компоненту data-URI. Результат кэшируется в памяти.
const cache = new Map<string, string>();

export function clearImageCache() {
    cache.clear();
}

function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * @param path    путь на API, например "/api/profile/avatar?v=..."; null/undefined — картинки нет
 * @param version любая строка, меняющаяся при замене файла (если путь тот же)
 */
export function useAuthImage(path?: string | null, version?: string) {
    const key = path ? `${path}|${version ?? ""}` : null;
    const [uri, setUri] = useState<string | null>(key ? (cache.get(key) ?? null) : null);

    useEffect(() => {
        if (!path || !key) {
            setUri(null);
            return;
        }

        const cached = cache.get(key);
        if (cached) {
            setUri(cached);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await apiFetch(path);
                if (!res.ok) {
                    if (!cancelled) setUri(null);
                    return;
                }
                const dataUri = await blobToDataUri(await res.blob());
                cache.set(key, dataUri);
                if (!cancelled) setUri(dataUri);
            } catch {
                if (!cancelled) setUri(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [path, key]);

    return uri;
}
