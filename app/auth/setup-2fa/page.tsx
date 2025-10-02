"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Smartphone,
  CheckCircle,
  AlertCircle,
  QrCode,
  Copy
} from "lucide-react";
import { verifyTotpSetupAction } from "@/action/totp-action";

export default function Setup2FAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: setup, 2: verify
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Redirigir si ya tiene 2FA configurado
    const checkTwoFactorStatus = async () => {
      try {
        const response = await fetch("/api/auth/2fa/status");
        if (response.ok) {
          const data = await response.json();
          if (data.enabled) {
            router.push("/dashboard/settings");
          }
        }
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      }
    };

    checkTwoFactorStatus();
  }, [status, router]);

  const handleSetupTwoFactor = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error al configurar 2FA");
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep(2);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al configurar la autenticación de dos factores");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await verifyTotpSetupAction({
        code: verificationCode,
        secret: secret
      });

      if (result.success) {
        setSuccess(true);
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push("/dashboard/settings?2fa=enabled");
        }, 2000);
      } else {
        setError(result.error || "Código inválido");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  const copySecretToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      // Mostrar mensaje de éxito
      const originalText = "Copiar clave secreta";
      const button = document.getElementById("copy-secret-btn");
      if (button) {
        button.textContent = "¡Copiado!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                ¡Configuración Exitosa!
              </h2>
              <p className="text-green-700 mb-4">
                La autenticación de dos factores ha sido activada correctamente.
              </p>
              <p className="text-sm text-gray-600">
                Redirigiendo a configuración...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            Configurar Autenticación de Dos Factores
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Añade una capa adicional de seguridad a tu cuenta
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Paso 1: Iniciar Configuración</span>
              </CardTitle>
              <CardDescription>
                Prepárate para escanear un código QR con tu aplicación de autenticación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Antes de continuar, necesitarás:
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Una aplicación de autenticación (Google Authenticator, Authy, etc.)</li>
                    <li>• Acceso a la cámara de tu dispositivo</li>
                    <li>• Un lugar seguro para guardar tus códigos de respaldo</li>
                  </ul>
                </div>

                <Button
                  onClick={handleSetupTwoFactor}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Configurando..." : "Configurar 2FA"}
                </Button>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/settings")}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Paso 2: Escanear Código QR</span>
                </CardTitle>
                <CardDescription>
                  Escanea este código con tu aplicación de autenticación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qrCodeUrl && (
                    <div className="flex justify-center p-4 bg-white border rounded-lg">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code for 2FA"
                        className="w-48 h-48"
                      />
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Clave secreta (si no puedes escanear el QR):
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={secret}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        id="copy-secret-btn"
                        variant="outline"
                        size="sm"
                        onClick={copySecretToClipboard}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Paso 3: Verificar Configuración</span>
                </CardTitle>
                <CardDescription>
                  Ingresa el código de 6 dígitos de tu aplicación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setVerificationCode(value);
                    }}
                    className="text-center text-lg tracking-widest"
                  />

                  <Button
                    onClick={handleVerifySetup}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full"
                  >
                    {loading ? "Verificando..." : "Verificar y Activar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Backup Codes */}
            {backupCodes.length > 0 && (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Códigos de Respaldo</span>
                  </CardTitle>
                  <CardDescription>
                    Guarda estos códigos en un lugar seguro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Si pierdes acceso a tu aplicación de autenticación, puedes usar uno de estos códigos de respaldo de un solo uso:
                    </p>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-yellow-50 rounded">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-xs bg-white p-2 rounded border text-center">
                          {code}
                        </code>
                      ))}
                    </div>
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Guarda estos códigos en un lugar seguro. No volverán a mostrarse.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/settings")}
              >
                Cancelar y Volver
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}