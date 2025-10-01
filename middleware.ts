import { NextResponse } from "next/server"
import { auth } from "@/auth"

// Crear un middleware que no se aplique a las rutas de autenticación
export default auth((req) => {
  const { nextUrl, auth } = req;
  const isLoggedIn = !!auth?.user;
  const userRole = auth?.user?.role;

  // Verificar estado de 2FA
  const requiresTwoFactor = auth?.user?.requiresTwoFactor === true;
  const isTwoFactorAuthenticated = auth?.user?.isTwoFactorAuthenticated === true;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/terms",
    "/privacy",
    "/about",
    "/contact",
    "/forgot-password",
    "/api/auth/verify-email",
    "/api/auth/request-password-reset",
    "/reset-password",
    "/api/auth/reset-password",
    "/auth/verify-totp" // Permitir acceso a la página de verificación TOTP
  ];

  // Rutas de API 2FA (siempre permitidas)
  const twoFactorApiRoutes = [
    "/api/auth/2fa/setup",
    "/api/auth/2fa/verify",
    "/api/auth/2fa/disable",
    "/api/auth/2fa/backup-codes"
  ];

  // Permitir cualquier subruta de /reset-password y rutas públicas
  const isPublic = publicRoutes.some(route =>
    nextUrl.pathname === route ||
    (route !== "/" && nextUrl.pathname.startsWith(route + "/"))
  );

  // Permitir rutas de API 2FA
  const isTwoFactorApiRoute = twoFactorApiRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  );

  // Detectar rutas de administración (panel y API)
  const isAdminRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");

  // Si es una ruta de API 2FA, permitir acceso
  if (isTwoFactorApiRoute) {
    return NextResponse.next();
  }

  // Si no está autenticado, redirigir a la página de inicio de sesión
  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Si el usuario está autenticado pero requiere 2FA y no está en la página de verificación
  if (isLoggedIn && requiresTwoFactor && !isTwoFactorAuthenticated) {
    // Si ya está en la página de verificación, permitir acceso
    if (nextUrl.pathname === "/auth/verify-totp") {
      return NextResponse.next();
    }

    // Si no, redirigir a la página de verificación TOTP
    return NextResponse.redirect(new URL("/auth/verify-totp", nextUrl));
  }

  // Si el usuario está completamente autenticado e intenta acceder a la página de verificación, redirigir al dashboard
  if (isLoggedIn && isTwoFactorAuthenticated && nextUrl.pathname === "/auth/verify-totp") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Si es ruta de admin y el usuario no es admin, redirigir a inicio
  if (isAdminRoute && isLoggedIn && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
})


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Exclude auth routes from middleware
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/auth).*)',
  ],
};



