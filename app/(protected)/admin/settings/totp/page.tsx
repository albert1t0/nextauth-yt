"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Shield } from "lucide-react";

const totpSettingsSchema = z.object({
  totpIssuer: z.string().min(1, "El issuer es requerido").max(50, "Máximo 50 caracteres"),
  totpDigits: z.number().min(6).max(8),
  totpPeriod: z.number().min(30).max(1800),
});

interface TOTPSettings {
  totpIssuer: string;
  totpDigits: number;
  totpPeriod: number;
}

export default function TOTPSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TOTPSettings>({
    resolver: zodResolver(totpSettingsSchema),
    defaultValues: {
      totpIssuer: "MyApp",
      totpDigits: 6,
      totpPeriod: 30,
    },
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings/totp");

      if (!response.ok) {
        if (response.status === 401) {
          setError("No tienes permisos para acceder a esta página");
          return;
        }
        throw new Error("Error al cargar configuración");
      }

      const data = await response.json();
      form.reset({
        totpIssuer: data.totpIssuer,
        totpDigits: data.totpDigits,
        totpPeriod: data.totpPeriod,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: TOTPSettings) => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings/totp", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("No tienes permisos para realizar esta acción");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar configuración");
      }

      toast.success("Configuración TOTP actualizada correctamente");
      await fetchSettings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configuración TOTP</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Cargando configuración...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configuración TOTP</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-32">
              <p className="text-red-500">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configuración TOTP</h1>
      </div>

      <p className="text-gray-600">
        Configura los parámetros globales para la autenticación de dos factores (TOTP)
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Configuración Global TOTP</span>
          </CardTitle>
          <CardDescription>
            Estos ajustes afectarán a todos los usuarios que habiliten la autenticación de dos factores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="totpIssuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Aplicación (Issuer)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mi App"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre que se mostrará en las aplicaciones de autenticación (Google Authenticator, Authy, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totpDigits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Dígitos</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el número de dígitos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6">6 dígitos</SelectItem>
                        <SelectItem value="8">8 dígitos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Longitud del código TOTP generado. 6 dígitos es el estándar más común.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totpPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de Validez (segundos)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">1 minuto</SelectItem>
                        <SelectItem value="120">2 minutos</SelectItem>
                        <SelectItem value="300">5 minutos</SelectItem>
                        <SelectItem value="600">10 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tiempo durante el cual cada código TOTP es válido antes de generar uno nuevo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? "Guardando..." : "Guardar Configuración"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchSettings()}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}