"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Shield, Smartphone } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Gestiona la configuración del sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Autenticación de Dos Factores (TOTP)</span>
            </CardTitle>
            <CardDescription>
              Configura los parámetros globales para la autenticación de dos factores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ajusta el nombre de la aplicación, número de dígitos y período de validez
                para los códigos TOTP utilizados en la autenticación de dos factores.
              </p>
              <Link href="/admin/settings/totp">
                <Button className="w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  Configurar TOTP
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Otras Configuraciones</span>
            </CardTitle>
            <CardDescription>
              Más opciones de configuración próximamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Se agregarán más opciones de configuración del sistema en futuras actualizaciones.
              </p>
              <Button disabled className="w-full">
                Próximamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}