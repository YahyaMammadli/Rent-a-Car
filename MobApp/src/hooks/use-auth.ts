import { AuthUser } from "@/utils/api-client";
import { createContext, useContext } from "react";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export type AuthContextType = {
    status: AuthStatus;
    user: AuthUser | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
    signOut: () => Promise<void>;
    /** Обновить данные пользователя после изменения профиля. */
    updateUser: (user: AuthUser) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
