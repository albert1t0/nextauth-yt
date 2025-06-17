import sgMail from '@sendgrid/mail';

// Configura tu API key de SendGrid
// Asegúrate de tener esta variable en tu archivo .env
console.log('Configurando SendGrid:', {
  hasApiKey: !!process.env.SENDGRID_API_KEY,
  envVars: process.env
});

if (!process.env.SENDGRID_API_KEY) {
  console.error('⚠️ SENDGRID_API_KEY no está definida en las variables de entorno');
  console.log('Variables de entorno disponibles:', Object.keys(process.env));
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Dirección de correo desde la cual se enviarán los emails
const FROM_EMAIL = process.env.FROM_EMAIL;

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Función genérica para enviar correos electrónicos
 */
export const sendEmail = async ({ to, subject, text, html }: EmailData) => {
  try {
    // Validamos que tengamos una API key configurada
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY no está configurada en las variables de entorno');
    }

    // Validamos que tengamos un email remitente configurado
    if (!FROM_EMAIL) {
      throw new Error('FROM_EMAIL no está configurada en las variables de entorno');
    }

    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: 'Tu Aplicación' // Puedes personalizar este nombre
      },
      subject,
      text: text || '',
      html: html || ''
    };

    // Log para debugging
    console.log('Intentando enviar email:', {
      to,
      from: FROM_EMAIL,
      subject,
      hasText: !!text,
      hasHtml: !!html
    });

    await sgMail.send(msg);
    return { success: true };
  } catch (error: unknown) {
    const errorObj = error as Error & { code?: string; response?: { body?: unknown } };
    console.error('Error detallado al enviar email:', {
      message: errorObj.message,
      code: errorObj?.code,
      response: errorObj?.response?.body,
    });
    return { 
      success: false, 
      error: {
        message: errorObj.message,
        code: errorObj?.code,
        details: errorObj?.response?.body
      }
    };
  }
};

/**
 * Envía un correo de verificación al usuario
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

  // Validar que tenemos todas las variables de entorno necesarias
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY no está configurada');
  }

  if (!process.env.FROM_EMAIL) {
    throw new Error('FROM_EMAIL no está configurada');
  }

  const emailData: EmailData = {
    to: email,
    subject: 'Verifica tu correo electrónico',
    text: `Verifica tu correo electrónico haciendo clic en: ${confirmLink}`, // Siempre incluir versión texto
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu correo electrónico</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333333; margin-bottom: 20px;">Verifica tu correo electrónico</h2>
            <p style="color: #666666; margin-bottom: 20px;">Haz clic en el siguiente enlace para verificar tu cuenta:</p>
            <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Verificar correo
            </a>
            <p style="color: #666666; margin-top: 20px;">Si no has creado una cuenta, puedes ignorar este correo.</p>
            <p style="color: #666666;">El enlace expirará en 1 hora.</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const result = await sendEmail(emailData);
    console.log('Email de verificación enviado correctamente a:', email);
    return result;
  } catch (error: any) {
    console.error('Error al enviar email de verificación:', {
      to: email,
      error: error.message,
      details: error.response?.body
    });
    throw new Error('No se pudo enviar el email de verificación. Por favor, intenta nuevamente.');
  }
};
};

/**
 * Envía un correo de restablecimiento de contraseña
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const emailData: EmailData = {
    to: email,
    subject: 'Restablece tu contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Restablece tu contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Restablecer contraseña
        </a>
        <p>Si no has solicitado restablecer tu contraseña, puedes ignorar este correo.</p>
        <p>El enlace expirará en 1 hora.</p>
      </div>
    `,
  };

  return sendEmail(emailData);
};
