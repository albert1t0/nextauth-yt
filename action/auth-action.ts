"use server";

import { z } from "zod";
import { loginSchema, registerSchema } from "@/lib/zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const loginAction = async (
    values: z.infer<typeof loginSchema>,
    callbackUrl?: string
) => {
    try {
        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl: callbackUrl || "/auth/post-login",
        });

        if (result?.error) {
            throw new Error(result.error);
        }

        return { success: true };
    } catch (error) {
        console.error("Login failed:", error);
        throw new Error(error instanceof Error ? error.message : "Error de autenticación");
    }
};

export const registerAction = async (
    values: z.infer<typeof registerSchema>,
    callbackUrl?: string
) => {
    try {

        const { data, success } = registerSchema.safeParse(values);
        if (!success){
            return { error: "Datos inválidos" };
        }

        // verificar si usuario existe por email o DNI
        const existingUserByEmail = await db.user.findUnique({
            where: {
                email: data.email,
            },
        });

        if (existingUserByEmail) {
            return { error: "El email ya está registrado" };
        }

        const existingUserByDni = await db.user.findUnique({
            where: {
                dni: data.dni,
            },
        });

        if (existingUserByDni) {
            return { error: "El DNI ya está registrado" };
        }

        // crear usuario
        const hashedPassword = await bcrypt.hash(data.password, 10);

        await db.user.create({
            data: {
                email: data.email,
                name: data.name,
                dni: data.dni,
                password: hashedPassword,
            },
        });

        // iniciar sesión
        await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
            callbackUrl: callbackUrl || "/auth/post-login",
        });

        return { success: true };

    } catch (error) {
        if (error instanceof AuthError) {
            return { error: error.cause?.err?.message };
        }
        return { error: "Error del servidor"} ;
    }
};
