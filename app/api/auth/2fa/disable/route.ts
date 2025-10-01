import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Schema para validar el request body
const disable2FASchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

/**
 * POST /api/auth/2fa/disable
 * Deshabilita la autenticación de dos factores para el usuario autenticado
 * Requiere verificación de contraseña para seguridad
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedFields = disable2FASchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { password } = validatedFields.data;

    // Obtener el usuario completo con la contraseña
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar la contraseña actual
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "La contraseña es incorrecta" },
        { status: 401 }
      );
    }

    // Verificar si el usuario tiene 2FA habilitado
    const twoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled) {
      return NextResponse.json(
        { error: "La autenticación de dos factores no está habilitada" },
        { status: 400 }
      );
    }

    // Ejecutar la deshabilitación en una transacción para asegurar atomicidad
    await db.$transaction(async (tx) => {
      // Deshabilitar 2FA y limpiar el secreto
      await tx.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: {
          enabled: false,
          secret: null,
          lastUsedAt: null,
        },
      });

      // Eliminar todos los códigos de respaldo
      await tx.backupCode.deleteMany({
        where: { userId: session.user.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Autenticación de dos factores deshabilitada correctamente",
    });

  } catch (error) {
    console.error("[2FA_DISABLE_ERROR]", error);
    return NextResponse.json(
      { error: "Error al deshabilitar la autenticación de dos factores" },
      { status: 500 }
    );
  }
}