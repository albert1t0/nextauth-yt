const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
  <div className="grid place-items-center min-h-screen bg-gray-50">
    {children}
  </div>
  )
};

export default AuthLayout;