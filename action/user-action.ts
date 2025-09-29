"use server";

import { z } from "zod";
import { updateProfileSchema, changePasswordSchema } from "@/lib/zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const updateProfileAction = async (values: z.infer<typeof updateProfileSchema>) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "No autorizado" };
    }

    const validatedFields = updateProfileSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Datos inválidos" };
    }

    const { name } = validatedFields.data;

    // Actualizar el nombre del usuario
    await db.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    return { success: "Perfil actualizado correctamente" };

  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Error al actualizar el perfil" };
  }
};

export const changePasswordAction = async (values: z.infer<typeof changePasswordSchema>) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "No autorizado" };
    }

    const validatedFields = changePasswordSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Datos inválidos" };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Obtener el usuario completo con la contraseña
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return { error: "Usuario no encontrado" };
    }

    // Verificar la contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return { error: "La contraseña actual es incorrecta" };
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: "Contraseña actualizada correctamente" };

  } catch (error) {
    console.error("Error changing password:", error);
    return { error: "Error al cambiar la contraseña" };
  }
};