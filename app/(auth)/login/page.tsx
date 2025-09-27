import FormLogin from '@/components/ui/form-login'
import React, { Suspense } from 'react'

const LoginPage
 = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormLogin />
    </Suspense>
   );
};

export default LoginPage;
