import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/2fa/complete
 * Completa el proceso de verificación 2FA actualizando el estado del usuario
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que el usuario esté en estado intermedio de 2FA
    if (!session.user.requiresTwoFactor) {
      return NextResponse.json(
        { error: "El usuario no requiere verificación 2FA" },
        { status: 400 }
      );
    }

    // Actualizar la configuración 2FA del usuario
    await db.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verificación 2FA completada exitosamente",
    });

  } catch (error) {
    console.error("[2FA_COMPLETE_ERROR]", error);
    return NextResponse.json(
      { error: "Error al completar la verificación 2FA" },
      { status: 500 }
    );
  }
}