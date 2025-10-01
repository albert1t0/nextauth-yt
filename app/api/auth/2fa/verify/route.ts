import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/totp";
import { decrypt, hashBackupCode } from "@/lib/encryption";
import { z } from "zod";

// Schema para validar el request body
const verify2FASchema = z.object({
  token: z.string().min(6, "El token debe tener al menos 6 dígitos"),
  backupCode: z.string().optional(),
});

/**
 * POST /api/auth/2fa/verify
 * Verifica un token TOTP o código de respaldo para habilitar 2FA
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
    const validatedFields = verify2FASchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { token, backupCode } = validatedFields.data;

    // Obtener la configuración 2FA del usuario
    const twoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.secret) {
      return NextResponse.json(
        { error: "No se encontró configuración 2FA. Por favor, inicia el proceso de configuración nuevamente." },
        { status: 404 }
      );
    }

    // Descifrar el secreto
    let decryptedSecret: string;
    try {
      decryptedSecret = decrypt(twoFactorAuth.secret);
    } catch (error) {
      console.error("[2FA_DECRYPT_ERROR]", error);
      return NextResponse.json(
        { error: "Error al procesar la configuración 2FA" },
        { status: 500 }
      );
    }

    let isValidToken = false;

    // Verificar si es un token TOTP válido
    if (token) {
      isValidToken = verifyToken(token, decryptedSecret);
    }

    // Si no es válido el TOTP, verificar si es un código de respaldo
    if (!isValidToken && backupCode) {
      // Buscar el código de respaldo en la base de datos
      const backupCodeRecord = await db.backupCode.findFirst({
        where: {
          userId: session.user.id,
          isUsed: false,
        },
      });

      if (backupCodeRecord) {
        // Verificar el código de respaldo
        const bcrypt = await import("bcryptjs");
        isValidToken = await bcrypt.compare(backupCode, backupCodeRecord.codeHash);

        if (isValidToken) {
          // Marcar el código de respaldo como usado
          await db.backupCode.update({
            where: { id: backupCodeRecord.id },
            data: { isUsed: true },
          });
        }
      }
    }

    if (!isValidToken) {
      return NextResponse.json(
        { error: "Token o código de respaldo inválido" },
        { status: 400 }
      );
    }

    // Si es la primera verificación (2FA no está habilitado), habilitarla
    if (!twoFactorAuth.enabled) {
      // Generar y almacenar códigos de respaldo
      const { generateBackupCodes } = await import("@/lib/totp");
      const plainBackupCodes = generateBackupCodes(10);

      // Hashear y almacenar los códigos de respaldo
      const backupCodePromises = plainBackupCodes.map(async (code) => {
        const hashedCode = await hashBackupCode(code);
        return db.backupCode.create({
          data: {
            codeHash: hashedCode,
            userId: session.user.id,
          },
        });
      });

      await Promise.all(backupCodePromises);

      // Habilitar 2FA y actualizar el último uso
      await db.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: {
          enabled: true,
          lastUsedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Autenticación de dos factores habilitada correctamente",
        backupCodes: plainBackupCodes, // Mostrar los códigos solo una vez
        isFirstTime: true,
      });
    }

    // Si 2FA ya estaba habilitado, solo actualizar el último uso
    await db.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Token verificado correctamente",
      isFirstTime: false,
    });

  } catch (error) {
    console.error("[2FA_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "Error al verificar el token de dos factores" },
      { status: 500 }
    );
  }
}