"use client";

import { z } from "zod";
import { totpVerificationSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { verifyTotpAction } from "@/action/totp-action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Key, AlertCircle } from "lucide-react";

const FormTotpVerify = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { update } = useSession();

  const form = useForm<z.infer<typeof totpVerificationSchema>>({
    resolver: zodResolver(totpVerificationSchema),
    defaultValues: {
      token: "",
      backupCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof totpVerificationSchema>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await verifyTotpAction(values);

        if (result.success) {
          // Actualizar la sesión para marcar 2FA como completado
          await update({
            user: {
              isTwoFactorAuthenticated: true,
              requiresTwoFactor: false
            }
          });

          setSuccess(true);
          // Redirigir al dashboard o URL especificada
          setTimeout(() => {
            router.push(result.redirectUrl || "/dashboard");
          }, 1000);
        } else {
          setError(result.error || "Código inválido");
        }
      } catch (err) {
        setError("Error al verificar el código. Inténtalo de nuevo.");
      }
    });
  }

  const handleUseBackupCode = () => {
    setShowBackupCode(true);
    form.setValue("token", ""); // Limpiar el campo TOTP
    form.clearErrors("token");
  };

  const handleUseTotpCode = () => {
    setShowBackupCode(false);
    form.setValue("backupCode", ""); // Limpiar el campo de respaldo
    form.clearErrors("backupCode");
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-lg font-semibold text-green-900">
              ¡Verificación exitosa!
            </h2>
            <p className="mt-2 text-sm text-green-700">
              Redirigiendo al dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6" />
          Verificación de Dos Factores
        </CardTitle>
        <CardDescription>
          Ingresa el código de 6 dígitos de tu aplicación de autenticación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!showBackupCode ? (
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código TOTP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        className="text-center text-lg tracking-widest"
                        onChange={(e) => {
                          // Solo permitir números
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Ingresa el código de 6 dígitos de Google Authenticator o similar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="backupCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Respaldo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingresa tu código de respaldo"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Usa uno de tus códigos de respaldo de un solo uso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? "Verificando..." : "Verificar"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={showBackupCode ? handleUseTotpCode : handleUseBackupCode}
                  className="text-sm"
                >
                  {showBackupCode
                    ? "Usar código TOTP en su lugar"
                    : "¿Problemas con el código? Usar código de respaldo"
                  }
                </Button>
              </div>
            </div>
          </form>
        </Form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">¿No tienes acceso a tu aplicación?</p>
              <p>
                Los códigos de respaldo son códigos de un solo uso que puedes usar
                cuando no puedes acceder a tu aplicación de autenticación.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormTotpVerify;