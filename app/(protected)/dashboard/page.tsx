import { auth } from "@/auth"
import LogoutButton from "@/components/ui/logout-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
 
export default async function DashBoardPage() {
  const session = await auth()
 
  if (!session) {
    return <div>Not authenticated</div>
  }
 
  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {session.user.role === 'admin' && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <h2 className="text-lg font-semibold mb-2">Panel de Administración</h2>
          <p className="text-sm text-gray-600 mb-3">
            Tienes permisos de administrador. Accede al panel admin.
          </p>
          <Link href="/admin">
            <Button>Ir al Panel Admin</Button>
          </Link>
        </div>
      )}
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Información de Sesión</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <LogoutButton />
    </div>
    
  )
}