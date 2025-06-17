import { auth } from '@/auth'
import LogoutButton from '@/components/ui/logout-button'
import React from 'react'

const AdminPage = async() => {

  const session = await auth()

  if (session?.user?.role !== 'admin') {
    return <div>You are not authorized to view this page</div>
  }

  return (
    <div className="container">
      <pre>{JSON.stringify(session, null, 2)}</pre>
      
      <LogoutButton />
    </div>
    
  )
}

export default AdminPage