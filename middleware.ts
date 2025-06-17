import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth: middleware } = NextAuth(authConfig)

const publicRoutes = [ 
  "/",
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/about",
  "/contact",
  "/forgot-password",
  "/reset-password"
]

export default middleware((req) => {
  const { nextUrl, auth } = req;
  const isLoggedIn = !!auth?.user;

  // proteger /dashboard y /admin
  if (!publicRoutes.includes(nextUrl.pathname) && !isLoggedIn) {
    // Si no está autenticado, redirigir a la página de inicio de sesión
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
})


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};



