"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, QrCode, Copy, CheckCircle, AlertCircle, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { verifyTotpSetupAction } from "@/action/totp-action";

const setupSchema = z.object({
  code: z.string().min(6, "El código debe tener 6 dígitos").max(6),
});

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

interface SetupData {
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  onSetupComplete,
}: TwoFactorSetupModalProps) {
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      code: "",
    },
  });

  // Cargar datos de configuración cuando se abre el modal
  const loadSetupData = async () => {
    if (setupData) return; // Ya cargado

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Error al cargar la configuración");
      }

      const data = await response.json();
      setSetupData({
        secret: data.secret || "",
        qrCodeDataURL: data.qrCodeDataURL || "",
        backupCodes: data.backupCodes || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      form.reset();
      setError(null);
      setCopied(false);
    } else {
      loadSetupData();
    }
  };

  const copyToClipboard = async () => {
    if (setupData?.secret) {
      try {
        await navigator.clipboard.writeText(setupData.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Error al copiar:", err);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof setupSchema>) => {
    if (!setupData) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await verifyTotpSetupAction({
          code: values.code,
          secret: setupData.secret,
        });

        if (result.success) {
          onSetupComplete();
        } else {
          setError(result.error || "Error en la verificación");
        }
      } catch (err) {
        setError("Error al verificar el código");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurar Autenticación de Dos Factores
          </DialogTitle>
          <DialogDescription>
            Escanea el código QR con tu aplicación de autenticación o ingresa
            manualmente la clave secreta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : setupData ? (
            <>
              {/* QR Code Section */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    {setupData.qrCodeDataURL ? (
                      <img
                        src={setupData.qrCodeDataURL}
                        alt="QR Code para 2FA"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">
                    Escanea este código con Google Authenticator, Authy, o una aplicación similar
                  </p>
                </div>
              </div>

              {/* Secret Key Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Clave Secreta (si no puedes escanear el código)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                  {setupData.secret}
                </div>
              </div>

              {/* Verification Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="code" className="text-sm font-medium">
                    Código de Verificación
                  </label>
                  <Input
                    id="code"
                    {...form.register("code")}
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    className="text-center text-lg tracking-widest mt-1"
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      form.setValue("code", value);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el código de 6 dígitos de tu aplicación
                  </p>
                </div>

                {form.formState.errors.code && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.code.message}
                  </p>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    className="flex-1"
                    disabled={isPending || !form.formState.isValid}
                  >
                    {isPending ? "Verificando..." : "Verificar y Activar"}
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {/* Instructions */}
          <div className="space-y-2 text-xs text-gray-600">
            <h4 className="font-medium">Instrucciones:</h4>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Abre tu aplicación de autenticación (Google Authenticator, Authy, etc.)</li>
              <li>Escanea el código QR o ingresa manualmente la clave secreta</li>
              <li>Ingresa el código de 6 dígitos que muestra la aplicación</li>
              <li>Guarda tus códigos de respaldo en un lugar seguro</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}