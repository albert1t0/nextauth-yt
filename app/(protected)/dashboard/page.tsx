"use client"

import { useSession } from "next-auth/react"
import { NavigationCard } from "@/components/dashboard/NavigationCard"
import {
  FolderOpen,
  User,
  Settings,
  BarChart3,
  Shield,
  LayoutDashboard
} from "lucide-react"
import LogoutButton from "@/components/ui/logout-button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashBoardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userName = session.user?.name || "Usuario"
  const isAdmin = session.user?.role === 'admin'

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          ¡Bienvenido, {userName}! 👋
        </h1>
        <p className="text-xl text-muted-foreground">
          ¿Qué te gustaría hacer hoy?
        </p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* File Management Card */}
        <NavigationCard
          title="Gestión de Archivos"
          description="Sube, organiza y gestiona tus archivos de manera segura"
          href="/dashboard/files"
          icon={FolderOpen}
        />

        {/* Profile Management Card */}
        <NavigationCard
          title="Mi Perfil"
          description="Gestiona tu información personal y preferencias"
          href="/dashboard/profile"
          icon={User}
        />

        {/* Settings Card */}
        <NavigationCard
          title="Configuración"
          description="Personaliza la configuración de tu cuenta"
          href="/dashboard/settings"
          icon={Settings}
        />

        {/* Reports Card (Coming Soon) */}
        <NavigationCard
          title="Reportes"
          description="Genera y visualiza reportes de tu actividad"
          icon={BarChart3}
          disabled={true}
        />

        {/* Admin Panel Card (Only for Admins) */}
        {isAdmin && (
          <NavigationCard
            title="Panel de Administración"
            description="Accede al panel de control del sistema"
            href="/admin"
            icon={Shield}
            className="border-yellow-500 hover:border-yellow-600"
          />
        )}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Tu Dashboard</h2>
          </div>
          <p className="text-blue-700">
            Aquí puedes acceder a todas las herramientas y funciones disponibles para ti.
          </p>
        </div>
      </div>

      {/* Logout Button */}
      <div className="text-center">
        <LogoutButton />
      </div>
    </div>
  )
}