"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PostLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Prevent navigation during loading
    if (status === "loading") {
      return;
    }

    // Handle authenticated users
    if (status === "authenticated" && session?.user?.role) {
      // Redirect based on user role (roles are: 'admin', 'user')
      const redirectPath = session.user.role === "admin"
        ? "/admin"
        : "/dashboard";

      console.log(`Redirecting user with role ${session.user.role} to: ${redirectPath}`);
      router.replace(redirectPath);
      return;
    }

    // Handle unauthenticated users
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to login");
      router.replace("/login");
    }
  }, [status, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Redirigiendo...</p>
        <p className="text-sm text-muted-foreground">
          {status === "loading" && "Verificando sesión..."}
          {status === "authenticated" && "Preparando su dashboard..."}
          {status === "unauthenticated" && "Redirigiendo al inicio de sesión..."}
        </p>
      </div>
    </div>
  );
}