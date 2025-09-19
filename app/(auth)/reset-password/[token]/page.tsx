import FormResetPassword from '@/components/ui/form-reset-password'
import React from 'react'

interface ResetPasswordPageProps {
  params: Promise<{
    token: string
  }>
}

const ResetPasswordPage = async ({ params }: ResetPasswordPageProps) => {
  const { token } = await params
  return (
    <div className='flex justify-center items-center h-screen'>
      <FormResetPassword token={token} />
    </div>
  )
}

export default ResetPasswordPage 