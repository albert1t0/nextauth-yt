import type { NextAuthConfig } from "next-auth"

import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sendVerificationEmail } from "./lib/mail";

// Nota: esto es solo un objeto, no una instancia completa de Auth.js
// Configuración principal de NextAuth
export default {
  providers: [
    // Configuración del proveedor de autenticación por credenciales (email/password)
    Credentials({
      async authorize(credentials) {
        // Validamos las credenciales usando Zod
        // Esto asegura que tengamos email y password con el formato correcto
        const { data, success } = loginSchema.safeParse(credentials);

        // Si la validación falla, retornamos null (autenticación fallida)
        if (!success) {
          return null;
        }

        // Buscamos al usuario en la base de datos por su email
        const user = await db.user.findUnique({
          where: {
            email: data.email
          },
        });

        // Si no existe el usuario o no tiene contraseña configurada
        // (por ejemplo, si se registró con OAuth), retornamos null
        if (!user || !user.password) {
          return null;
        }

        // Comparamos la contraseña proporcionada con el hash almacenado
        // usando bcrypt para la verificación segura
        const isValid = await bcrypt.compare(data.password, user.password);

        // Si la contraseña no coincide, retornamos null
        if (!isValid) {
          return null;
        }

        // Proceso de verificación de email
        // Solo se ejecuta si el email del usuario no está verificado
        if (!user.emailVerified) {
          // Antes de crear un nuevo token, eliminamos cualquier token de verificación previo
          // asociado a este correo electrónico para evitar duplicados y confusión.
          await db.verificationToken.deleteMany({
            where: {
              identifier: user.email,
            },
          });

          // Generamos un nuevo token de verificación
          const token = nanoid();
          // Guardamos el token en la base de datos
          // El token expirará en 1 hora (3600000 ms)
          await db.verificationToken.create({
            data: {
              identifier: user.email,
              token,
              expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
            },
          });

          // Enviar email de verificación
          await sendVerificationEmail(user.email, token);

          throw new Error(
            'Correo electrónico no verificado. Por favor, revisa tu bandeja de entrada para el enlace de verificación.',
          );
        }

        // Retornamos solo los datos necesarios del usuario
        // Estos datos estarán disponibles en la sesión
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      },
    }),
  ],

  // Configuración de páginas para personalizar las rutas de autenticación
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Configuración de sesión
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },

  // Configuración de callbacks
  callbacks: {
    async jwt({ token, user, session, trigger }) {
      // Actualizar el token cuando el usuario inicia sesión
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Actualizar el token cuando la sesión se actualiza
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.email = session.user.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // Configuración adicional para evitar problemas de sesión
  trustHost: true,
} satisfies NextAuthConfig;