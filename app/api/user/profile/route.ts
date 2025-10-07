import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { updateProfileSchema } from "@/lib/zod";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dni: user.dni,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar los datos de entrada
    const validatedFields = updateProfileSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validatedFields.error.errors },
        { status: 400 }
      );
    }

    const { name, dni } = validatedFields.data;

    // Verificar que el DNI no exista si se está actualizando
    if (dni) {
      const existingUser = await db.user.findFirst({
        where: {
          dni: dni,
          id: { not: session.user.id },
        },
        select: { id: true, email: true },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "El DNI ya está registrado por otro usuario" },
          { status: 400 }
        );
      }
    }

    // Actualizar el perfil del usuario
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        ...(dni && { dni }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error updating profile:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Error de validación", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}