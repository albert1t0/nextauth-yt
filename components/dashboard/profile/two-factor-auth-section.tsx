"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldCheck, Key, AlertCircle, CheckCircle } from "lucide-react";
import { TwoFactorSetupModal } from "./two-factor-setup-modal";
import { TwoFactorBackupCodes } from "./two-factor-backup-codes";
import { TwoFactorDisableDialog } from "./two-factor-disable-dialog";
import { formatDate } from "@/lib/utils";

interface TwoFactorAuthSectionProps {
  isTwoFactorEnabled: boolean;
  lastTwoFactorUsed?: Date | null;
}

export function TwoFactorAuthSection({
  isTwoFactorEnabled,
  lastTwoFactorUsed,
}: TwoFactorAuthSectionProps) {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isBackupCodesOpen, setIsBackupCodesOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isPending] = useTransition();

  const handleSetupComplete = () => {
    setIsSetupModalOpen(false);
    setIsBackupCodesOpen(true);
  };

  const handleDisableSuccess = () => {
    setIsDisableDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-lg">Autenticación de Dos Factores</CardTitle>
            </div>
            <Badge variant={isTwoFactorEnabled ? "default" : "secondary"}>
              {isTwoFactorEnabled ? (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Activada
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Desactivada
                </div>
              )}
            </Badge>
          </div>
          <CardDescription>
            Añade una capa adicional de seguridad a tu cuenta usando una aplicación
            de autenticación como Google Authenticator o Authy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Message */}
          {isTwoFactorEnabled ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Tu cuenta está protegida con autenticación de dos factores.
                  {lastTwoFactorUsed && (
                    <span className="block mt-1 text-sm">
                      Último uso: {formatDate(lastTwoFactorUsed)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsBackupCodesOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  Ver Códigos de Respaldo
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setIsDisableDialogOpen(true)}
                  className="flex items-center gap-2"
                  disabled={isPending}
                >
                  <AlertCircle className="h-4 w-4" />
                  Desactivar 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Recomendamos activar la autenticación de dos factores para proteger
                  tu cuenta contra accesos no autorizados.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setIsSetupModalOpen(true)}
                className="w-full flex items-center gap-2"
                disabled={isPending}
              >
                <ShieldCheck className="h-4 w-4" />
                Activar Autenticación de Dos Factores
              </Button>
            </div>
          )}

          {/* How it works section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">¿Cómo funciona?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Escanea un código QR con tu aplicación de autenticación</li>
              <li>• Ingresa un código de verificación para confirmar</li>
              <li>• Guarda tus códigos de respaldo para emergencias</li>
              <li>• En cada inicio de sesión, ingresa un código de 6 dígitos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Setup Modal */}
      <TwoFactorSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSetupComplete={handleSetupComplete}
      />

      {/* Backup Codes Modal */}
      <TwoFactorBackupCodes
        isOpen={isBackupCodesOpen}
        onClose={() => setIsBackupCodesOpen(false)}
      />

      {/* Disable Confirmation Dialog */}
      <TwoFactorDisableDialog
        isOpen={isDisableDialogOpen}
        onClose={() => setIsDisableDialogOpen(false)}
        onDisableSuccess={handleDisableSuccess}
      />
    </>
  );
}