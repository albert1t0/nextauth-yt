import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AccountInfo } from "@/components/dashboard/profile/account-info";
import { FormProfile } from "@/components/dashboard/profile/form-profile";
import { FormChangePassword } from "@/components/dashboard/profile/form-change-password";
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

  return user;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userData = await getProfileData(session.user.id);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-xl text-muted-foreground">
          Gestiona tu información personal y configuración
        </p>
      </div>

      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Account Info and Profile Form */}
        <div className="space-y-6">
          <AccountInfo
            email={userData.email}
            name={userData.name || "Usuario"}
            dni={userData.dni}
            role={userData.role}
            emailVerified={userData.emailVerified}
            createdAt={userData.createdAt}
          />

          <FormProfile
            initialName={userData.name || ""}
            initialDni={userData.dni || ""}
          />
        </div>

        {/* Right Column - Password Change Form */}
        <div className="space-y-6">
          <FormChangePassword />
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">
            Seguridad de tu Cuenta
          </h2>
          <p className="text-blue-700">
            Mantén tu información segura actualizando regularmente tu contraseña
            y verificando que tu correo electrónico esté confirmado.
          </p>
        </div>
      </div>
    </div>
  );
}