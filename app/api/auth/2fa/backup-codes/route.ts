import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateBackupCodes } from "@/lib/totp";
import { hashBackupCode } from "@/lib/encryption";

// Schema para validar el request body
const backupCodesSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

/**
 * POST /api/auth/2fa/backup-codes
 * Genera nuevos códigos de respaldo para el usuario con 2FA habilitada
 * Requiere verificación de contraseña para seguridad
 * Los códigos solo se muestran una vez
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

    // TypeScript assertion: userId is guaranteed to exist after the check above
    const userId = userId;

    const body = await request.json();
    const validatedFields = backupCodesSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { password } = validatedFields.data;

    // Obtener el usuario completo con la contraseña
    const user = await db.user.findUnique({
      where: { id: userId },
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
      where: { userId: userId },
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled) {
      return NextResponse.json(
        { error: "La autenticación de dos factores debe estar habilitada para generar códigos de respaldo" },
        { status: 400 }
      );
    }

    // Generar nuevos códigos de respaldo
    const newBackupCodes = generateBackupCodes(10);

    // Ejecutar la actualización en una transacción para asegurar atomicidad
    const plainCodes = await db.$transaction(async (tx) => {
      // Eliminar códigos de respaldo existentes
      await tx.backupCode.deleteMany({
        where: { userId: userId },
      });

      // Crear nuevos códigos de respaldo hasheados
      const backupCodePromises = newBackupCodes.map(async (code) => {
        const hashedCode = await hashBackupCode(code);
        return tx.backupCode.create({
          data: {
            codeHash: hashedCode,
            userId: userId,
          },
        });
      });

      await Promise.all(backupCodePromises);

      // Retornar los códigos en texto plano (solo esta vez)
      return newBackupCodes;
    });

    return NextResponse.json({
      success: true,
      backupCodes: plainCodes,
      message: "Nuevos códigos de respaldo generados correctamente. Guárdalos en un lugar seguro.",
      warning: "Estos códigos solo se muestran una vez. Si los pierdes, deberás generar nuevos códigos.",
    });

  } catch (error) {
    console.error("[2FA_BACKUP_CODES_ERROR]", error);
    return NextResponse.json(
      { error: "Error al generar códigos de respaldo" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/2fa/backup-codes/status
 * Verifica el estado de los códigos de respaldo del usuario
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Contar códigos de respaldo disponibles
    const availableBackupCodes = await db.backupCode.count({
      where: {
        userId: userId,
        isUsed: false,
      },
    });

    // Verificar si el usuario tiene 2FA habilitado
    const twoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: userId },
      select: { enabled: true },
    });

    return NextResponse.json({
      hasTwoFactorEnabled: twoFactorAuth?.enabled || false,
      availableBackupCodes,
      totalBackupCodes: availableBackupCodes, // Para compatibilidad
      message: availableBackupCodes > 0
        ? `Tienes ${availableBackupCodes} códigos de respaldo disponibles`
        : "No tienes códigos de respaldo disponibles",
    });

  } catch (error) {
    console.error("[2FA_BACKUP_CODES_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: "Error al verificar el estado de los códigos de respaldo" },
      { status: 500 }
    );
  }
}