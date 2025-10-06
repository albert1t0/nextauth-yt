"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const disableSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

interface TwoFactorDisableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDisableSuccess: () => void;
}

export function TwoFactorDisableDialog({
  isOpen,
  onClose,
  onDisableSuccess,
}: TwoFactorDisableDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof disableSchema>>({
    resolver: zodResolver(disableSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      form.reset();
      setError(null);
      setShowPassword(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof disableSchema>) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/2fa/disable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: values.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          onDisableSuccess();
        } else {
          setError(data.error || "Error al desactivar 2FA");
        }
      } catch (err) {
        setError("Error de conexión. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Desactivar Autenticación de Dos Factores
          </DialogTitle>
          <DialogDescription>
            Para desactivar la autenticación de dos factores, debes confirmar tu identidad
            ingresando tu contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>¡Advertencia de Seguridad!</strong> Desactivar 2FA reducirá la
              seguridad de tu cuenta. Te recomendamos mantenerla activada.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña Actual
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending || !form.formState.isValid}
              >
                {isPending ? "Desactivando..." : "Desactivar 2FA"}
              </Button>
            </DialogFooter>
          </form>

          {/* Security Note */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-gray-600 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Nota de Seguridad:</p>
                <p>
                  Si desactivas 2FA, tu cuenta solo estará protegida por tu contraseña.
                  Considera usar una contraseña fuerte y única si decides desactivar
                  esta capa adicional de seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}