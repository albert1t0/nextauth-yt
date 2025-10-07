"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";

interface UseLogoutOptions {
    onLogoutStart?: () => void;
    onLogoutComplete?: () => void;
    onLogoutError?: (error: Error) => void;
    timeout?: number;
    fallbackUrl?: string;
}

export const useLogout = (options: UseLogoutOptions = {}) => {
    const {
        onLogoutStart,
        onLogoutComplete,
        onLogoutError,
        timeout = 1500,
        fallbackUrl = "/login"
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            onLogoutStart?.();

            // Ejecutar logout con timeout optimizado
            const logoutPromise = signOut({
                callbackUrl: fallbackUrl,
                redirect: false
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Logout timeout")), timeout)
            );

            await Promise.race([logoutPromise, timeoutPromise]);

            // Logout exitoso - redirigir
            window.location.href = fallbackUrl;

        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown logout error");
            setError(error);
            onLogoutError?.(error);

            // Estrategia de fallback: limpiar sesión manualmente
            try {
                // Limpiar cookies de sesión
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    if (name.includes("session") || name.includes("auth") || name.includes("next-auth")) {
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                    }
                });

                // Limpiar localStorage/sessionStorage relacionados con auth
                localStorage.removeItem("nextauth.message");
                sessionStorage.removeItem("nextauth.message");
            } catch (cleanupError) {
                console.error("Error cleaning up session:", cleanupError);
            }

            // Siempre redirigir como fallback
            window.location.href = fallbackUrl;
        } finally {
            setIsLoading(false);
            onLogoutComplete?.();
        }
    }, [onLogoutStart, onLogoutComplete, onLogoutError, timeout, fallbackUrl]);

    const reset = useCallback(() => {
        setError(null);
        setIsLoading(false);
    }, []);

    return {
        logout,
        isLoading,
        error,
        reset
    };
};