import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

import authConfig from "@/auth.config"

// Exportamos las funciones y handlers necesarios de NextAuth
export const {
  handlers,  // Manejadores de rutas para la API de autenticación
  signIn,    // Función para iniciar sesión
  signOut,   // Función para cerrar sesión
  auth       // Función para obtener la sesión actual
} = NextAuth({
  // Configuramos el adaptador de Prisma para almacenar los datos de autenticación
  adapter: PrismaAdapter(db),

  // Importamos el resto de la configuración desde auth.config.ts
  ...authConfig,
});

