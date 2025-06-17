import { sendEmail } from './lib/mail'; // Asegúrate de que la ruta sea correcta

async function testEmail() {
  try {
    const result = await sendEmail({
      to: 'fernando.moreno@pucp.edu.pe', // Cambia esto por tu email
      subject: 'Correo de prueba',
      html: '<h1>Esto es una prueba</h1><p>Si ves este mensaje, el envío de correos está funcionando correctamente.</p>'
    });
    
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Error en prueba:', error);
  }
}

testEmail();
