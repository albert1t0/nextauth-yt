import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const force2FASchema = z.object({
  isTwoFactorForced: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = force2FASchema.parse(body);

    // Verificar que el usuario existe
    const user = await db.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        email: true,
        isTwoFactorForced: true,
        twoFactorAuth: {
          select: { enabled: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Actualizar el estado de forzado 2FA
    const updatedUser = await db.user.update({
      where: { id: params.userId },
      data: { isTwoFactorForced: validatedData.isTwoFactorForced },
      select: {
        id: true,
        email: true,
        isTwoFactorForced: true,
        twoFactorAuth: {
          select: { enabled: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isTwoFactorForced: updatedUser.isTwoFactorForced,
        has2FAEnabled: updatedUser.twoFactorAuth?.enabled || false,
        needs2FASetup: updatedUser.isTwoFactorForced && !updatedUser.twoFactorAuth?.enabled
      }
    });

  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating user 2FA status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}