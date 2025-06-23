import FormResetPassword from '@/components/ui/form-reset-password'
import React from 'react'

interface ResetPasswordPageProps {
  params: {
    token: string
  }
}

const ResetPasswordPage = ({ params }: ResetPasswordPageProps) => {
  return (
    <div className='flex justify-center items-center h-screen'>
      <FormResetPassword token={params.token} />
    </div>
  )
}

export default ResetPasswordPage 