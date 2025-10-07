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

        // Buscamos al usuario en la base de datos por su email, incluyendo datos de 2FA
        const user = await db.user.findUnique({
          where: {
            email: data.email
          },
          include: {
            twoFactorAuth: true
          }
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

        // Verificar si el usuario tiene 2FA habilitado
        const isTwoFactorEnabled = user.twoFactorAuth?.enabled || false;

        // Si el usuario tiene 2FA habilitado, retornamos un objeto parcial
        // que indica que se necesita verificación de segundo factor
        if (isTwoFactorEnabled) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            dni: user.dni,
            role: user.role,
            isTwoFactorEnabled: true,
            requiresTwoFactor: true // Indicador claro de que se requiere 2FA
          };
        }

        // Si no tiene 2FA, retornamos el objeto de usuario completo
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          dni: user.dni,
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

  // Configuración para optimizar el rendimiento
  useSecureCookies: process.env.NODE_ENV === "production",

  
  // Configuración de callbacks
  callbacks: {
    async jwt({ token, user, session, trigger }) {
      // Actualizar el token cuando el usuario inicia sesión
      if (user) {
        token.id = user.id;
        token.dni = user.dni;
        token.role = user.role;

        // Manejar el estado de 2FA
        if (user.requiresTwoFactor) {
          // Estado intermedio: contraseña verificada pero 2FA pendiente
          token.isTwoFactorAuthenticated = false;
          token.requiresTwoFactor = true;
        } else {
          // Estado completamente autenticado
          token.isTwoFactorAuthenticated = true;
          token.requiresTwoFactor = false;
        }
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
        session.user.dni = token.dni as string;
        session.user.role = token.role as string;

        // Incluir información de 2FA en la sesión
        session.user.isTwoFactorAuthenticated = token.isTwoFactorAuthenticated as boolean;
        session.user.requiresTwoFactor = token.requiresTwoFactor as boolean;
      }
      return session;
    },
  },

  // Configuración adicional para evitar problemas de sesión
  trustHost: true,

  // Optimizar el proceso de logout
  events: {
    async signOut({ session }) {
      // Limpiar cualquier caché o estado adicional si es necesario
      // Esto se ejecuta cuando el usuario cierra sesión
      if (session?.user?.email) {
        console.log("User signed out:", session.user.email);
      }
    },
  },
} satisfies NextAuthConfig;