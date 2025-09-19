import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReturnToDashboardButton } from '@/components/ui/return-to-dashboard-button'
import {
  LayoutDashboard,
  Users,
  Settings
} from 'lucide-react'
import { auth } from '@/auth'
import LogoutButton from '@/components/ui/logout-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Panel de Administración
              </h1>
              <Badge variant="secondary">Admin</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <ReturnToDashboardButton />
              </Link>
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)]">
          <div className="p-6">
            <ul className="space-y-2">
              <li>
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/admin/users">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Gestión de Usuarios
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/admin/settings">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Button>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}