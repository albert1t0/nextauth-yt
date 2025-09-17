'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Activity, Download, Copy, List, Settings } from 'lucide-react'
import useSWR from 'swr'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const AdminPage = () => {
  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register?ref=admin`)
      alert('Enlace de invitación copiado al portapapeles')
    } catch (err) {
      console.error('Error al copiar enlace:', err)
    }
  }
  const { data, error, isLoading } = useSWR('/api/admin/stats', fetcher)

  if (error) return <div>Error loading dashboard data</div>
  if (isLoading) return <div>Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Hoy
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary?.newUsersToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Nuevos hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary?.totalAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">
              Rol admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestiona usuarios y configuraciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link 
              href="/api/admin/users/export"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-8 w-8 mb-2 text-blue-600" />
              <span className="text-sm font-medium">Exportar Usuarios</span>
              <span className="text-xs text-muted-foreground">Descargar CSV</span>
            </Link>

            <button
              onClick={copyInvitationLink}
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Copy className="h-8 w-8 mb-2 text-green-600" />
              <span className="text-sm font-medium">Copiar Enlace</span>
              <span className="text-xs text-muted-foreground">Invitación</span>
            </button>

            <Link 
              href="/admin/users"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <List className="h-8 w-8 mb-2 text-purple-600" />
              <span className="text-sm font-medium">Ver Usuarios</span>
              <span className="text-xs text-muted-foreground">Gestionar</span>
            </Link>

            <Link 
              href="/admin/users/import"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-8 w-8 mb-2 text-orange-600" />
              <span className="text-sm font-medium">Importar</span>
              <span className="text-xs text-muted-foreground">Usuarios CSV</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Registration Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Usuarios</CardTitle>
          <CardDescription>
            Nuevos usuarios registrados en los últimos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.registrationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                  formatter={(value) => [value, 'Usuarios']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPage