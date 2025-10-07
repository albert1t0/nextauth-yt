"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useLogout } from "@/hooks/use-logout";

interface LogoutButtonProps {
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

const LogoutButton = ({
    className = "",
    variant = "outline",
    size = "default"
}: LogoutButtonProps) => {
    const { logout, isLoading } = useLogout({
        timeout: 1500, // 1.5 segundos para mejor experiencia
        onLogoutStart: () => {
            console.log("Starting logout process...");
        },
        onLogoutComplete: () => {
            console.log("Logout process completed");
        },
        onLogoutError: (error) => {
            console.error("Logout failed:", error);
        }
    });

    return (
        <Button
            onClick={logout}
            disabled={isLoading}
            variant={variant}
            size={size}
            className={`flex items-center space-x-2 ${className}`}
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
    );
};

export default LogoutButton;
