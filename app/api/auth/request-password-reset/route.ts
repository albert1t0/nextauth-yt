import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomBytes } from 'node:crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: 'Dirección de correo electrónico inválida' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = requestPasswordResetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (user) {
      // Invalidate old tokens for this user
      await db.passwordResetToken.deleteMany({
        where: { identifier: email },
      });

      const token = randomBytes(32).toString('hex');
      const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour from now

      await db.passwordResetToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      
      try {
        await sendPasswordResetEmail(email, resetLink);
      } catch (emailError) {
        console.error('Error al enviar el correo de restablecimiento:', emailError);
        // No detener la solicitud si el correo falla, solo registrar el error.
      }
    }

    return NextResponse.json({ message: 'Si su correo electrónico está en nuestro sistema, recibirá un enlace para restablecer su contraseña.' }, { status: 200 });

  } catch (error) {
    console.error('Error al solicitar el restablecimiento de contraseña:', error);
    return NextResponse.json({ message: 'Ocurrió un error interno.' }, { status: 500 });
  }
} 