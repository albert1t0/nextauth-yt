import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateUserRoleSchema, updateProfileSchema } from "@/lib/zod";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Validate userId parameter
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate data with appropriate schema based on what's being updated
    let validatedData: any = {};

    if (body.role !== undefined) {
      const roleData = updateUserRoleSchema.parse({ role: body.role });
      validatedData.role = roleData.role;
    }

    if (body.dni !== undefined || body.name !== undefined) {
      const profileData = updateProfileSchema.parse({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.dni !== undefined && { dni: body.dni }),
      });
      if (profileData.name !== undefined) validatedData.name = profileData.name;
      if (profileData.dni !== undefined) validatedData.dni = profileData.dni;
    }

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, name: true, dni: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent admin from changing their own role to user (security measure)
    if (userId === session.user.id && validatedData.role === "user") {
      return NextResponse.json(
        { error: "Cannot remove admin role from your own account" },
        { status: 403 }
      );
    }

    // Check for DNI uniqueness if updating DNI
    if (validatedData.dni !== undefined) {
      const dniCheck = await db.user.findFirst({
        where: {
          dni: validatedData.dni,
          id: { not: userId },
        },
        select: { id: true, email: true },
      });

      if (dniCheck) {
        return NextResponse.json(
          { error: "El DNI ya está registrado por otro usuario" },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.dni !== undefined) {
      updateData.dni = validatedData.dni;
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        dni: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let successMessage = "User updated successfully";
    if (validatedData.role !== undefined) {
      successMessage = `User role updated successfully to ${validatedData.role}`;
    } else if (validatedData.dni !== undefined) {
      successMessage = `User DNI updated successfully`;
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      user: updatedUser,
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Validation error",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}