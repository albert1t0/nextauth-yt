"use server";

import { z } from "zod";
import { totpVerificationSchema } from "@/lib/zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/totp";
import { decrypt } from "@/lib/encryption";

interface VerifyTotpResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Verifica un código TOTP o código de respaldo para completar la autenticación de dos factores
 */
export const verifyTotpAction = async (
  values: z.infer<typeof totpVerificationSchema>
): Promise<VerifyTotpResult> => {
  try {
    // Validar los datos de entrada
    const validatedFields = totpVerificationSchema.safeParse(values);

    if (!validatedFields.success) {
      return { success: false, error: "Datos inválidos" };
    }

    const { token, backupCode } = validatedFields.data;

    // Obtener la sesión actual del usuario
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar que el usuario esté en estado de requerir 2FA
    if (!session.user.requiresTwoFactor) {
      return { success: false, error: "Este usuario no requiere verificación de dos factores" };
    }

    // Obtener la configuración 2FA del usuario
    const twoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled || !twoFactorAuth.secret) {
      return { success: false, error: "Configuración 2FA no encontrada" };
    }

    let isValidToken = false;

    // Primero intentar verificar el token TOTP
    if (token) {
      try {
        const decryptedSecret = decrypt(twoFactorAuth.secret);
        isValidToken = verifyToken(token, decryptedSecret);
      } catch (error) {
        console.error("[TOTP_DECRYPT_ERROR]", error);
        return { success: false, error: "Error al procesar la verificación" };
      }
    }

    // Si el token TOTP no es válido, intentar con código de respaldo
    if (!isValidToken && backupCode) {
      const backupCodeRecord = await db.backupCode.findFirst({
        where: {
          userId: session.user.id,
          isUsed: false,
        },
      });

      if (backupCodeRecord) {
        // Verificar el código de respaldo usando bcrypt
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
      return { success: false, error: "Código inválido" };
    }

    // Actualizar el último uso de 2FA
    await db.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: { lastUsedAt: new Date() },
    });

    // Llamar al endpoint para completar la verificación 2FA
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/2fa/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("[2FA_COMPLETE_API_ERROR]", await response.text());
      }
    } catch (error) {
      console.error("[2FA_COMPLETE_FETCH_ERROR]", error);
    }

    // Determinar la URL de redirección basada en el rol del usuario
    const redirectUrl = session.user.role === "admin" ? "/admin" : "/dashboard";

    return {
      success: true,
      redirectUrl,
    };

  } catch (error) {
    console.error("[TOTP_VERIFICATION_ERROR]", error);
    return { success: false, error: "Error al verificar el código" };
  }
};

/**
 * Verifica si el usuario actual requiere verificación 2FA
 */
export const checkTwoFactorStatus = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { requiresTwoFactor: false };
    }

    const twoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
      select: { enabled: true },
    });

    return {
      requiresTwoFactor: twoFactorAuth?.enabled || false,
      isTwoFactorAuthenticated: session.user.isTwoFactorAuthenticated || false,
    };

  } catch (error) {
    console.error("[CHECK_2FA_STATUS_ERROR]", error);
    return { requiresTwoFactor: false };
  }
};