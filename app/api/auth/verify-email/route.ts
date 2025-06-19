import { NextResponse } from "next/server";
import { db } from "@/lib/db";
/**
 * Este manejador de ruta se encarga de verificar el token de email.
 * Se activa cuando el usuario hace clic en el enlace de verificación enviado a su correo.
 */
export async function GET(request: Request) {
  try {
    console.log("Iniciando verificación de token...");
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    console.log("Token recibido:", token);

    if (!token) {
      console.log("Error: Token no proporcionado.");
      return new NextResponse("Falta el token de verificación.", { status: 400 });
    }

    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    });
    console.log("Token encontrado en la BD:", existingToken);

    if (!existingToken) {
      console.log("Error: Token no encontrado en la BD.");
      return new NextResponse("El token de verificación no es válido o ya fue utilizado.", { status: 404 });
    }

    const hasExpired = new Date(existingToken.expires) < new Date();
    console.log("¿Token expirado?:", hasExpired);

    if (hasExpired) {
      console.log("Info: El token ha expirado, eliminándolo.");
      await db.verificationToken.delete({
        where: { token: existingToken.token },
      });
      return new NextResponse("Tu token de verificación ha expirado. Por favor, solicita uno nuevo.", { status: 410 });
    }

    console.log("Buscando usuario con email:", existingToken.identifier);
    const existingUser = await db.user.findUnique({
      where: { email: existingToken.identifier },
    });
    console.log("Usuario encontrado:", existingUser);

    if (!existingUser) {
      console.log("Error: Usuario no encontrado.");
      return new NextResponse("No se encontró un usuario asociado a este token.", { status: 400 });
    }

    console.log("Iniciando transacción de base de datos...");
    await db.$transaction(async (tx) => {
      console.log("Actualizando usuario...");
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: new Date(),
          email: existingToken.identifier,
        },
      });
      console.log("Usuario actualizado. Eliminando token...");
      await tx.verificationToken.delete({
        where: { token: existingToken.token },
      });
      console.log("Token eliminado.");
    });
    console.log("Transacción completada con éxito.");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log("NEXT_PUBLIC_APP_URL:", appUrl);
    if (!appUrl) {
      console.error("La variable de entorno NEXT_PUBLIC_APP_URL no está definida.");
      return new NextResponse("¡Correo verificado con éxito! Ahora puedes iniciar sesión.", { status: 200 });
    }

    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("verified", "1");
    console.log("Redirigiendo a:", loginUrl.toString());

    return NextResponse.redirect(loginUrl);

  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    return new NextResponse("Ocurrió un error interno al verificar el correo.", { status: 500 });
  }
}
