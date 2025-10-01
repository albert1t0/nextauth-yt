import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateTOTPSetup } from "@/lib/totp";
import { encrypt } from "@/lib/encryption";

/**
 * POST /api/auth/2fa/setup
 * Inicia el proceso de configuración de 2FA para el usuario autenticado
 * Genera un nuevo secreto TOTP y un código QR para escanear
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

    // Verificar si el usuario ya tiene 2FA habilitado
    const existingTwoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (existingTwoFactorAuth?.enabled) {
      return NextResponse.json(
        { error: "La autenticación de dos factores ya está habilitada" },
        { status: 400 }
      );
    }

    // Generar datos de configuración TOTP
    const totpSetup = await generateTOTPSetup(
      session.user.email,
      process.env.NEXT_PUBLIC_APP_NAME
    );

    // Encriptar el secreto para almacenarlo
    const encryptedSecret = encrypt(totpSetup.secret);

    // Guardar o actualizar la configuración TOTP del usuario
    await db.twoFactorAuth.upsert({
      where: { userId: session.user.id },
      update: {
        secret: encryptedSecret,
        enabled: false, // Se habilitará después de la verificación
      },
      create: {
        userId: session.user.id,
        secret: encryptedSecret,
        enabled: false,
        digits: 6, // Por defecto
        period: 30, // Por defecto
      },
    });

    // Retornar los datos necesarios para el cliente (excepto el secreto)
    return NextResponse.json({
      qrCodeDataURL: totpSetup.qrCodeDataURL,
      backupCodes: totpSetup.backupCodes, // Estos códigos se mostrarán solo una vez
      message: "Escanea el código QR con tu aplicación de autenticación",
    });

  } catch (error) {
    console.error("[2FA_SETUP_ERROR]", error);
    return NextResponse.json(
      { error: "Error al configurar la autenticación de dos factores" },
      { status: 500 }
    );
  }
}