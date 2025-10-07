"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { LogOut, Loader2, X } from "lucide-react";

const LogoutButtonOptimized = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [canCancel, setCanCancel] = useState(false);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Permitir cancelar después de 1 segundo
            const timeout = setTimeout(() => {
                setCanCancel(true);
            }, 1000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        } else {
            setProgress(0);
            setCanCancel(false);
        }
    }, [isLoading]);

    const handleClick = async () => {
        try {
            setIsLoading(true);

            // Estrategia de logout optimizada con múltiples intentos
            const logoutPromise = signOut({
                callbackUrl: "/login",
                redirect: false
            });

            // Timeout más corto para mejor experiencia
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Logout timeout")), 1500)
            );

            await Promise.race([logoutPromise, timeoutPromise]);

            // Redirección exitosa
            window.location.href = "/login";

        } catch (error) {
            console.error("Error during logout:", error);

            // Intento de fallback: limpiar sesión manualmente
            try {
                // Limpiar cookies de sesión manualmente
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    if (name.includes("session") || name.includes("auth")) {
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                    }
                });
            } catch (e) {
                console.error("Error clearing cookies:", e);
            }

            // Siempre redirigir al login
            window.location.href = "/login";
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsLoading(false);
        setProgress(0);
        setCanCancel(false);
    };

    return (
        <div className="relative">
            <Button
                onClick={handleClick}
                disabled={isLoading}
                variant="outline"
                className="flex items-center space-x-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cerrando sesión...</span>
                    </>
                ) : (
                    <>
                        <LogOut className="h-4 w-4" />
                        <span>Terminar sesión</span>
                    </>
                )}
            </Button>

            {/* Indicador de progreso */}
            {isLoading && (
                <div className="absolute -bottom-2 left-0 right-0">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {canCancel && (
                        <Button
                            onClick={handleCancel}
                            size="sm"
                            variant="ghost"
                            className="absolute -bottom-8 right-0 text-xs text-gray-500 hover:text-red-600"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogoutButtonOptimized;