import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcryptjs from 'bcryptjs';

const resetPasswordSchema = z.object({
  token: z.string().nonempty("El token no puede estar vacío."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, password } = validation.data;

    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }

    const hasExpired = new Date(passwordResetToken.expires) < new Date();

    if (hasExpired) {
      return NextResponse.json({ error: "El token ha expirado." }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: passwordResetToken.identifier },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    await db.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });

    await db.passwordResetToken.delete({
      where: { token: passwordResetToken.token },
    });

    return NextResponse.json({ message: "La contraseña ha sido restablecida con éxito." }, { status: 200 });

  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return NextResponse.json({ error: "Ocurrió un error interno." }, { status: 500 });
  }
} 