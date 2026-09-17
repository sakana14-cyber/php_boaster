"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
    user: User | null;
    isLoading: boolean;
    refresh: () => Promise<void>;
    setUser: (user: User | null) => void;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const data = await apiFetch<{ user: User }>("/api/me");
            setUser(data.user);
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                setUser(null);
            } else {
                throw error;
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await apiFetch("/api/logout", { method: "POST" });
        setUser(null);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時にログイン状態を取得する
        refresh();
    }, [refresh]);

    return (
        <AuthContext.Provider value={{ user, isLoading, refresh, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
