import sgMail from '@sendgrid/mail';

// Es una mejor práctica configurar la API key una sola vez al iniciar la aplicación.
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('⚠️ SENDGRID_API_KEY no está definida. El servicio de correo no funcionará.');
}

const FROM_EMAIL = process.env.FROM_EMAIL;

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Función genérica y robusta para enviar correos electrónicos usando SendGrid.
 */
export const sendEmail = async ({ to, subject, text, html }: EmailData) => {
  // Validaciones en tiempo de ejecución para asegurar que las variables críticas existen.
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Error: Intento de enviar email sin API Key de SendGrid.');
    throw new Error('La configuración del servidor de correo está incompleta.');
  }
  if (!FROM_EMAIL) {
    console.error('Error: Intento de enviar email sin un email remitente (FROM_EMAIL).');
    throw new Error('La configuración del servidor de correo está incompleta.');
  }

  // Estructura del mensaje que cumple con los tipos de @sendgrid/mail
  const msg: sgMail.MailDataRequired = {
    to: to,
    from: {
      email: FROM_EMAIL,
      name: 'Sistema de Autenticación', // Nombre del remitente personalizable
    },
    subject: subject,
    text: text,
    html: html,
  };

  try {
    console.log(`Enviando email a ${to} con asunto "${subject}"`);
    await sgMail.send(msg);
    console.log('✅ Email enviado correctamente.');
    return { success: true };
  } catch (error: unknown) {
    console.error('❌ Error al enviar el email:');
    
    // Tienes toda la razón, 'unknown' es más seguro que 'any'.
    // Hacemos una comprobación de tipo para manejar el error de forma segura.
    if (typeof error === 'object' && error !== null) {
      if ('response' in error) {
        // Parece un error de SendGrid, intentamos acceder a los detalles.
        const responseBody = (error as { response: { body: unknown } }).response.body;
        console.error('Detalles del error de SendGrid:', JSON.stringify(responseBody, null, 2));
      } else if ('message' in error) {
        // Es un error más genérico, pero podemos obtener el mensaje.
        console.error('Error general:', (error as { message: string }).message);
      } else {
        console.error('El objeto de error no tiene propiedades `response` o `message`:', error);
      }
    } else {
      // El error no es un objeto, lo registramos tal cual.
      console.error('Ocurrió un error de tipo no esperado:', error);
    }
    
    return { 
      success: false, 
      error: 'No se pudo enviar el correo.'
    };
  }
};

/**
 * Envía un correo de verificación al usuario con una plantilla HTML mejorada.
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  
  const subject = 'Verifica tu dirección de correo electrónico';
  const text = `Gracias por registrarte. Por favor, haz clic en el siguiente enlace para verificar tu cuenta: ${verificationLink}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #333;">Verificación de Correo Electrónico</h2>
      <p>¡Gracias por registrarte! Para completar tu registro, por favor, verifica tu dirección de correo electrónico haciendo clic en el botón de abajo.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Verificar mi Correo</a>
      </div>
      <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <hr>
      <p style="font-size: 12px; color: #888;">Si no te registraste en nuestro sitio, por favor ignora este correo.</p>
    </div>`;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Envía un correo de restablecimiento de contraseña.
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const subject = 'Instrucciones para restablecer tu contraseña';
  const text = `Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetLink}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #333;">Restablecimiento de Contraseña</h2>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para elegir una nueva contraseña.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Restablecer Contraseña</a>
      </div>
      <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <hr>
      <p style="font-size: 12px; color: #888;">Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo de forma segura.</p>
    </div>`;

  return sendEmail({ to: email, subject, text, html });
};
