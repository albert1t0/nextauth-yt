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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Key, Download, Copy, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface TwoFactorBackupCodesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupCodesResponse {
  codes: string[];
}

export function TwoFactorBackupCodes({
  isOpen,
  onClose,
}: TwoFactorBackupCodesProps) {
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadBackupCodes = async () => {
    if (backupCodes.length > 0) return; // Ya cargados

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/backup-codes");
      if (!response.ok) {
        throw new Error("Error al cargar los códigos de respaldo");
      }

      const data: BackupCodesResponse = await response.json();
      setBackupCodes(data.codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setShowCodes(false);
      setCopied(false);
    } else {
      loadBackupCodes();
    }
  };

  const copyToClipboard = async () => {
    const codesText = backupCodes.join("\n");
    try {
      await navigator.clipboard.writeText(codesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const downloadAsTxt = () => {
    const content = `Códigos de Respaldo - Autenticación de Dos Factores
Generados: ${new Date().toLocaleString('es-ES')}

INSTRUCCIONES IMPORTANTES:
- Guarda estos códigos en un lugar seguro y privado
- Cada código solo puede usarse una vez
- Úsalos cuando no tengas acceso a tu aplicación de autenticación
- NO compartas estos códigos con nadie

CÓDIGOS DE RESPALDO:
${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Advertencia: Estos códigos son como contraseñas. Trátalos con la misma seguridad.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const regenerateCodes = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/2fa/backup-codes", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Error al regenerar códigos");
        }

        const data: BackupCodesResponse = await response.json();
        setBackupCodes(data.codes);
        setShowCodes(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Códigos de Respaldo
          </DialogTitle>
          <DialogDescription>
            Estos códigos te permiten acceder a tu cuenta si pierdes acceso a
            tu aplicación de autenticación. Guárdalos en un lugar seguro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Security Warning */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>¡MUY IMPORTANTE!</strong> Guarda estos códigos en un lugar seguro.
                  Cada código solo puede usarse una vez y son tu única forma de acceso
                  si pierdes tu aplicación de autenticación.
                </AlertDescription>
              </Alert>

              {/* Backup Codes Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Tus Códigos de Respaldo</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCodes(!showCodes)}
                    className="flex items-center gap-1"
                  >
                    {showCodes ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        Mostrar
                      </>
                    )}
                  </Button>
                </div>

                {showCodes ? (
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="p-2 bg-white border rounded font-mono text-sm text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-lg text-center">
                    <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">
                      Haz clic en "Mostrar" para ver tus códigos
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    disabled={!showCodes || copied}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar Todo
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={downloadAsTxt}
                    disabled={!showCodes}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar .txt
                  </Button>
                </div>

                <Button
                  onClick={regenerateCodes}
                  variant="secondary"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? "Generando..." : "Generar Nuevos Códigos"}
                </Button>
              </div>

              {/* Instructions */}
              <div className="space-y-2 text-xs text-gray-600">
                <h4 className="font-medium">Recomendaciones:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Imprime estos códigos y guárdalos en un lugar seguro</li>
                  <li>No los guardes en el mismo dispositivo que tu aplicación</li>
                  <li>Cada código es de un solo uso</li>
                  <li>Genera nuevos códigos si usas más de 5 de los 10 disponibles</li>
                </ul>
              </div>
            </>
          )}

          {/* Dialog Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}