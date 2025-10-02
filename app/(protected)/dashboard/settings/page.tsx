"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Settings,
  Lock,
  Unlock,
  ArrowLeft,
  Home
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Simular carga de estado de 2FA (aquí iría una llamada a la API)
    const checkTwoFactorStatus = async () => {
      try {
        // Llamada a API para verificar estado 2FA
        const response = await fetch("/api/auth/2fa/status");
        if (response.ok) {
          const data = await response.json();
          setTwoFactorEnabled(data.enabled || false);
        }
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkTwoFactorStatus();
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSetupTwoFactor = () => {
    // Redirigir a la página de configuración de 2FA
    router.push("/auth/setup-2fa");
  };

  const handleDisableTwoFactor = async () => {
    if (window.confirm("¿Estás seguro de que deseas desactivar la autenticación de dos factores? Esto reducirá la seguridad de tu cuenta.")) {
      try {
        const response = await fetch("/api/auth/2fa/disable", {
          method: "POST",
        });

        if (response.ok) {
          setTwoFactorEnabled(false);
          // Mostrar mensaje de éxito
          alert("Autenticación de dos factores desactivada correctamente");
        } else {
          alert("Error al desactivar la autenticación de dos factores");
        }
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        alert("Error al desactivar la autenticación de dos factores");
      }
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Inicio</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight">Configuración</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Gestiona la configuración de tu cuenta y seguridad
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Two Factor Authentication Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Autenticación de Dos Factores</span>
              {twoFactorEnabled ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Activada
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Desactivada
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Añade una capa adicional de seguridad a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                {twoFactorEnabled ? (
                  <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <Unlock className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div className="text-sm">
                  {twoFactorEnabled ? (
                    <div>
                      <p className="font-medium text-green-900">
                        La autenticación de dos factores está activada
                      </p>
                      <p className="text-green-700">
                        Tu cuenta está protegida con un código adicional además de tu contraseña.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-yellow-900">
                        La autenticación de dos factores está desactivada
                      </p>
                      <p className="text-yellow-700">
                        Te recomendamos activar la 2FA para mayor seguridad de tu cuenta.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!twoFactorEnabled ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleSetupTwoFactor}
                    className="w-full"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Activar Autenticación de Dos Factores
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Necesitarás una aplicación de autenticación como Google Authenticator
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleDisableTwoFactor}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Desactivar 2FA
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    No recomendamos desactivar esta función
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configuración de Cuenta</span>
            </CardTitle>
            <CardDescription>
              Gestiona tu información personal y preferencias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Key className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Contraseña</p>
                    <p className="text-xs text-gray-500">Cambia tu contraseña</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/profile")}
                >
                  Cambiar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Información Personal</p>
                    <p className="text-xs text-gray-500">Actualiza tus datos</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/profile")}
                >
                  Editar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tips */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Consejos de seguridad:</strong> Mantén tu contraseña segura, nunca la compartas con nadie,
          y considera activar la autenticación de dos factores para una protección adicional.
        </AlertDescription>
      </Alert>

      {/* Return to Dashboard Section */}
      <div className="mt-12 text-center border-t pt-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Has terminado de gestionar tu configuración?
            </h3>
          </div>
          <p className="text-gray-600">
            Vuelve al panel principal para acceder a otras funciones
          </p>
          <Link href="/dashboard">
            <Button className="flex items-center space-x-2 mx-auto">
              <Home className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}