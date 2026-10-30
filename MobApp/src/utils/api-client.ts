import { Platform } from "react-native";
import { secureStorage } from "./storage";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5080").replace(/\/+$/, "");

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "cachedUser";

export type AuthUser = { id: string; name: string; email: string; avatarUrl: string | null };

export type AuthResponse = {
    token: string;
    expiresAtUtc: string;
    refreshToken: string;
    refreshTokenExpiresAtUtc: string;
    user: AuthUser;
};

/** Сервер недоступен (не запущен, неверный IP, закрыт порт, другая сеть). */
export class NetworkError extends Error {
    constructor() {
        super(
            `Cannot reach the server at ${API_URL}.\n` +
                "Check that the API is running, EXPO_PUBLIC_API_URL is correct " +
                "and the phone and the computer are in the same Wi-Fi network.",
        );
        this.name = "NetworkError";
    }
}

/** Ответ сервера с ошибкой (ProblemDetails). */
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public errors: Record<string, string[]> = {},
    ) {
        super(message);
        this.name = "ApiError";
    }

    /** Есть ли ошибка валидации по полю (без учёта регистра ключа). */
    hasField(field: string) {
        return Object.keys(this.errors).some((k) => k.toLowerCase() === field.toLowerCase());
    }
}

export async function readError(res: Response): Promise<ApiError> {
    const body = await res.json().catch(() => null);
    const errors: Record<string, string[]> = body?.errors && typeof body.errors === "object" ? body.errors : {};
    const firstFieldError = Object.values(errors)
        .flat()
        .find((m) => typeof m === "string");

    let message: string = firstFieldError ?? body?.detail ?? body?.title ?? "";
    if (!message) {
        message = res.status === 429 ? "Too many attempts. Try again in a minute." : `Request failed (${res.status})`;
    }
    return new ApiError(message, res.status, errors);
}

export function errorMessage(e: unknown, fallback = "Something went wrong") {
    return e instanceof Error && e.message ? e.message : fallback;
}

async function rawFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
        return await fetch(url, init);
    } catch {
        throw new NetworkError();
    }
}

// ---------- сессия ----------

let onSessionExpired: (() => void) | null = null;
/** AuthProvider подписывается, чтобы вернуть пользователя на экран входа, когда refresh-токен умер. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
    onSessionExpired = handler;
}

export async function saveSession(auth: AuthResponse) {
    await Promise.all([
        secureStorage.setItem(ACCESS_KEY, auth.token),
        secureStorage.setItem(REFRESH_KEY, auth.refreshToken),
        secureStorage.setItem(USER_KEY, JSON.stringify(auth.user)),
    ]);
}

export async function clearSession() {
    await Promise.all([
        secureStorage.removeItem(ACCESS_KEY),
        secureStorage.removeItem(REFRESH_KEY),
        secureStorage.removeItem(USER_KEY),
    ]);
}

export async function hasSession() {
    return (await secureStorage.getItem(REFRESH_KEY)) !== null;
}

export async function saveCachedUser(user: AuthUser) {
    await secureStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadCachedUser(): Promise<AuthUser | null> {
    try {
        const raw = await secureStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

// Один общий запрос обновления: если несколько запросов получили 401 одновременно,
// refresh уйдёт один раз (токен одноразовый, второй параллельный обмен был бы отклонён).
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
    refreshing ??= (async () => {
        try {
            const refreshToken = await secureStorage.getItem(REFRESH_KEY);
            if (!refreshToken) return null;

            const res = await rawFetch(`${API_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                // 401 = refresh-токен недействителен -> сессия закончилась.
                // Остальные ошибки (5xx, нет сети) не должны разлогинивать пользователя.
                if (res.status === 401) {
                    await clearSession();
                    onSessionExpired?.();
                }
                return null;
            }

            const auth = (await res.json()) as AuthResponse;
            await saveSession(auth);
            return auth.token;
        } catch {
            return null; // нет сети
        } finally {
            refreshing = null;
        }
    })();

    return refreshing;
}

/** fetch с подстановкой Bearer-токена и однократным автообновлением при 401. Бросает NetworkError, если сервер недоступен. */
export async function apiFetch(path: string, init: RequestInit = {}, canRetry = true): Promise<Response> {
    const token = await secureStorage.getItem(ACCESS_KEY);

    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await rawFetch(`${API_URL}${path}`, { ...init, headers });
    if (res.status !== 401 || !canRetry) return res;

    const newToken = await refreshAccessToken();
    if (!newToken) return res;

    return apiFetch(path, init, false);
}

/** GET/POST/... с JSON-ответом. При !ok бросает ApiError. */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await apiFetch(path, init);
    if (!res.ok) throw await readError(res);
    return (await res.json()) as T;
}

export function jsonBody(data: unknown): RequestInit {
    return {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    };
}

// ---------- авторизация ----------

async function authRequest(path: string, data: unknown): Promise<AuthResponse> {
    const res = await rawFetch(`${API_URL}${path}`, jsonBody(data));
    if (!res.ok) throw await readError(res);

    const auth = (await res.json()) as AuthResponse;
    await saveSession(auth);
    return auth;
}

export const signIn = (email: string, password: string) => authRequest("/api/auth/sign-in", { email, password });

export const signUp = (name: string, email: string, password: string, confirmPassword: string) =>
    authRequest("/api/auth/sign-up", { name, email, password, confirmPassword });

export async function signOut() {
    const refreshToken = await secureStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
        // отзываем токен на сервере; если сети нет — всё равно выходим локально
        await rawFetch(`${API_URL}/api/auth/logout`, jsonBody({ refreshToken })).catch(() => {});
    }
    await clearSession();
}

// ---------- загрузка файлов ----------

const guessMime = (uri: string) => {
    const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    return "image/jpeg";
};

/** Добавляет локальный файл (uri из ImagePicker) в multipart-форму. Работает на native и в браузере. */
export async function appendImage(form: FormData, field: string, uri: string, mime?: string | null) {
    if (Platform.OS === "web") {
        const blob = await (await fetch(uri)).blob();
        form.append(field, blob, "photo.jpg");
        return;
    }
    form.append(field, { uri, name: "photo.jpg", type: mime ?? guessMime(uri) } as unknown as Blob);
}
