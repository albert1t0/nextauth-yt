import { NextResponse } from "next/server"
import { auth } from "@/auth"

// Crear un middleware que no se aplique a las rutas de autenticación
export default auth((req) => {
  const { nextUrl, auth } = req;
  const isLoggedIn = !!auth?.user;
  const userRole = auth?.user?.role;

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
    "/api/auth/reset-password"
  ];

  // Permitir cualquier subruta de /reset-password y rutas públicas
  const isPublic = publicRoutes.some(route =>
    nextUrl.pathname === route ||
    (route !== "/" && nextUrl.pathname.startsWith(route + "/"))
  );

  // Detectar rutas de administración (panel y API)
  const isAdminRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");

  if (!isPublic && !isLoggedIn) {
    // Si no está autenticado, redirigir a la página de inicio de sesión
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminRoute && isLoggedIn && userRole !== "admin") {
    // Si es ruta de admin y el usuario no es admin, redirigir a inicio
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



