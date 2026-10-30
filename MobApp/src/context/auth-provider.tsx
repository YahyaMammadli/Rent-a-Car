import { AuthContext, AuthStatus } from "@/hooks/use-auth";
import { clearImageCache } from "@/hooks/use-auth-image";
import * as api from "@/utils/api-client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUser] = useState<api.AuthUser | null>(null);

    const finishSignedOut = useCallback(() => {
        clearImageCache();
        setUser(null);
        setStatus("signedOut");
    }, []);

    // Refresh-токен умер (отозван/истёк) -> на экран входа
    useEffect(() => {
        api.setSessionExpiredHandler(finishSignedOut);
        return () => api.setSessionExpiredHandler(null);
    }, [finishSignedOut]);

    // При старте: есть ли сохранённая сессия и жива ли она
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!(await api.hasSession())) {
                if (!cancelled) setStatus("signedOut");
                return;
            }

            try {
                const res = await api.apiFetch("/api/auth/me");
                if (cancelled) return;

                if (res.ok) {
                    const me = (await res.json()) as api.AuthUser;
                    await api.saveCachedUser(me);
                    setUser(me);
                    setStatus("signedIn");
                    return;
                }

                // refresh-токен недействителен -> сессия уже очищена
                if (!(await api.hasSession())) {
                    finishSignedOut();
                    return;
                }
            } catch {
                // сервер недоступен — ниже пробуем открыть приложение с сохранённым профилем
            }

            if (cancelled) return;
            const cached = await api.loadCachedUser();
            if (cached) {
                setUser(cached);
                setStatus("signedIn");
            } else {
                finishSignedOut();
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [finishSignedOut]);

    const signIn = useCallback(async (email: string, password: string) => {
        const auth = await api.signIn(email.trim(), password);
        setUser(auth.user);
        setStatus("signedIn");
    }, []);

    const signUp = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
        const auth = await api.signUp(name.trim(), email.trim(), password, confirmPassword);
        setUser(auth.user);
        setStatus("signedIn");
    }, []);

    const signOut = useCallback(async () => {
        await api.signOut();
        finishSignedOut();
    }, [finishSignedOut]);

    const updateUser = useCallback((next: api.AuthUser) => {
        setUser(next);
        api.saveCachedUser(next).catch(() => {});
    }, []);

    const value = useMemo(
        () => ({ status, user, signIn, signUp, signOut, updateUser }),
        [status, user, signIn, signUp, signOut, updateUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
