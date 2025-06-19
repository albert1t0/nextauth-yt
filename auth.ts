import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

//import { PrismaAdapter } from "@auth/prisma-adapter"

import authConfig from "@/auth.config"
//import { prisma } from "@/lib/prisma"

// Exportamos las funciones y handlers necesarios de NextAuth
export const { 
  handlers,  // Manejadores de rutas para la API de autenticación
  signIn,    // Función para iniciar sesión
  signOut,   // Función para cerrar sesión
  auth       // Función para obtener la sesión actual
} = NextAuth({
  // Configuramos el adaptador de Prisma para almacenar los datos de autenticación
  adapter: PrismaAdapter(db),

  // Configuramos la estrategia de sesión como JWT (JSON Web Token)
  // Esto significa que los datos de la sesión se almacenarán en un token en lugar de la base de datos
  session: { 
    strategy: "jwt",
  },

  // Importamos el resto de la configuración desde auth.config.ts
  ...authConfig,

  // Callbacks son funciones que se ejecutan en diferentes momentos del proceso de autenticación
  callbacks: {
    /**
     * El callback jwt se ejecuta cada vez que se crea o actualiza un token JWT
     * @param token - El token JWT actual
     * @param user - Los datos del usuario (solo disponible durante el inicio de sesión)
     * @returns El token JWT modificado
     */
    jwt({ token, user }) {
      if (user) {
        // Durante el inicio de sesión, agregamos el ID y rol del usuario al token
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    /**
     * El callback session se ejecuta cada vez que se crea o actualiza una sesión
     * Este callback nos permite personalizar los datos que estarán disponibles en el cliente
     * @param session - La sesión actual
     * @param token - El token JWT actual
     * @returns La sesión modificada
     */
    session({ session, token }) {
      // Transferimos el ID y rol del token a la sesión
      // Esto hace que estos datos estén disponibles en el cliente
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});

