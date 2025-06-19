import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Este manejador de ruta se encarga de verificar el token de email.
 * Se activa cuando el usuario hace clic en el enlace de verificación enviado a su correo.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Falta el token de verificación.", { status: 400 });
    }

    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return new NextResponse("El token de verificación no es válido o ya fue utilizado.", { status: 404 });
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      await db.verificationToken.delete({
        where: { token: existingToken.token },
      });
      return new NextResponse("Tu token de verificación ha expirado. Por favor, solicita uno nuevo.", { status: 410 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: existingToken.identifier },
    });

    if (!existingUser) {
      return new NextResponse("No se encontró un usuario asociado a este token.", { status: 400 });
    }

    // Usamos una transacción para asegurar que ambas operaciones (actualizar usuario y eliminar token)
    // se completen con éxito.
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: new Date(),
          email: existingToken.identifier,
        },
      });

      await tx.verificationToken.delete({
        where: { token: existingToken.token },
      });
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("La variable de entorno NEXT_PUBLIC_APP_URL no está definida.");
      // Si no podemos redirigir, al menos confirmamos que el email fue verificado.
      return new NextResponse("¡Correo verificado con éxito! Ahora puedes iniciar sesión.", { status: 200 });
    }

    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("verified", "1"); // '1' para éxito

    return NextResponse.redirect(loginUrl);

  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    // En un entorno de producción, es mejor no exponer detalles del error.
    return new NextResponse("Ocurrió un error interno al verificar el correo.", { status: 500 });
  }
}
