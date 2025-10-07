import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AccountInfo } from "@/components/dashboard/profile/account-info";
import { FormProfile } from "@/components/dashboard/profile/form-profile";
import { FormChangePassword } from "@/components/dashboard/profile/form-change-password";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home, Settings, AlertTriangle, UserCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Perfil",
  description: "Gestiona tu perfil y configuración de cuenta",
};

async function getProfileData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      dni: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return {
    ...user,
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userData = await getProfileData(session.user.id);

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
        <h1 className="text-4xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-xl text-muted-foreground">
          Gestiona tu información personal y configuración
        </p>
      </div>

      {/* DNI Required Alert */}
      {!userData.dni && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Información de DNI Requerida
            </CardTitle>
            <CardDescription className="text-amber-700">
              Para continuar usando la aplicación, es necesario que proporciones tu número de DNI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-amber-600">
                Por motivos de seguridad y cumplimiento normativo, todos los usuarios deben tener registrado su DNI.
                No podrás acceder a otras secciones de la aplicación hasta completes esta información.
              </p>
              <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                <UserCheck className="h-4 w-4" />
                Por favor, completa tu DNI en el formulario a continuación.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Account Info and Profile Form */}
        <div className="space-y-6">
          <AccountInfo
            email={userData.email}
            name={userData.name || "Usuario"}
            dni={userData.dni || undefined}
            role={userData.role}
            emailVerified={userData.emailVerified}
            createdAt={userData.createdAt}
          />

          <FormProfile
            initialName={userData.name || ""}
            initialDni={userData.dni || undefined}
          />
        </div>

        {/* Right Column - Security Section */}
        <div className="space-y-6">
          <FormChangePassword />
        </div>
      </div>

      {/* Security Settings Section */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-blue-900">
            Configuración de Seguridad Adicional
          </h2>
          <p className="text-blue-700">
            Para configurar la autenticación de dos factores y otras opciones de seguridad avanzadas,
            visita la página de configuración.
          </p>
          <Link href="/dashboard/settings">
            <Button variant="outline" className="flex items-center space-x-2 mx-auto">
              <Settings className="h-4 w-4" />
              <span>Ir a Configuración de Seguridad</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Return to Dashboard Section */}
      <div className="mt-8 text-center border-t pt-8">
        <p className="text-gray-600 mb-4">¿Has terminado de gestionar tu perfil?</p>
        <Link href="/dashboard">
          <Button className="flex items-center space-x-2 mx-auto">
            <Home className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}