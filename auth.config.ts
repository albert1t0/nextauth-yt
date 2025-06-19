import type { NextAuthConfig } from "next-auth"

import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sendVerificationEmail } from "./lib/mail";

 
// Notice this is only an object, not a full Auth.js instance
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
          // Buscamos si existe un token de verificación previo
          const verifyTokenExists = await db.verificationToken.findFirst({
            where: {
              identifier: user.email
            }
          });

          // Si existe un token previo, lo eliminamos para evitar duplicados
          if (verifyTokenExists) {
            await db.verificationToken.delete({
              where: {
                identifier_token: {
                  identifier: user.email,
                  token: verifyTokenExists.token
                }
              }
            });
          }

          // Generamos un nuevo token de verificación
          const token = nanoid();
          // Guardamos el token en la base de datos
          // El token expirará en 1 hora (3600000 ms)
          await db.verificationToken.create({
            data: {
              identifier: user.email,
              token,
              expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
            }
          });

          // Enviar email de verificación
          // Aquí podrías llamar a una función para enviar el email de verificación
          await sendVerificationEmail(user.email, token);

          throw new Error("Email no verificado. Por favor, revisa tu bandeja de entrada para el enlace de verificación.");
          return null; // Aseguramos que no se retorne un usuario no verificado
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
} satisfies NextAuthConfig;