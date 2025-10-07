import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");
    const userId = searchParams.get("userId");

    if (!dni) {
      return NextResponse.json(
        { error: "DNI es requerido" },
        { status: 400 }
      );
    }

    // Validar formato del DNI
    const dniRegex = /^[A-Za-z0-9]{8}$/;
    if (!dniRegex.test(dni)) {
      return NextResponse.json(
        { error: "El DNI debe tener exactamente 8 caracteres alfanuméricos" },
        { status: 400 }
      );
    }

    // Verificar que el DNI no exista (excepto para el mismo usuario)
    const existingUser = await db.user.findFirst({
      where: {
        dni: dni,
        ...(userId && { id: { not: userId } }),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "El DNI ya está registrado",
          existingUser: {
            email: existingUser.email,
            name: existingUser.name,
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "DNI disponible"
    });

  } catch (error) {
    console.error("Error checking DNI:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}