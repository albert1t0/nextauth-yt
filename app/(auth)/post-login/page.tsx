"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PostLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    // Evitar redirecciones múltiples
    if (redirectAttempted) return;

    if (session) {
      setRedirectAttempted(true);

      // Check if user requires TOTP verification
      if (session.user.requiresTwoFactor && !session.user.isTwoFactorAuthenticated) {
        setTimeout(() => {
          window.location.href = "/auth/verify-totp";
        }, 500);
        return;
      }

      // Limpiar cualquier caché de sesión antes de redirigir
      setTimeout(() => {
        if (session.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }, 500);
    } else {
      // Si no hay sesión después de cargar, redirigir a login
      if (!redirectAttempted) {
        setRedirectAttempted(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }
  }, [session, status, router, redirectAttempted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div>
          <p className="text-lg font-medium text-gray-900">Verificando sesión...</p>
          <p className="text-sm text-gray-500">Por favor espere un momento</p>
        </div>
      </div>
    </div>
  );
}