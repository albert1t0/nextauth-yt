import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configuración de TOTP
authenticator.options = {
  step: 30, // 30 segundos por defecto
  window: 1, // ventana de verificación (token actual y anterior)
};

export interface TOTPSetupData {
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
}

/**
 * Genera un nuevo secreto TOTP
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Genera un URI otpauth:// para apps de autenticación
 */
export function generateOtpAuthUri(
  accountName: string,
  secret: string,
  issuer?: string
): string {
  const appIssuer = issuer || process.env.NEXT_PUBLIC_APP_NAME || 'NextAuth App';
  return authenticator.keyuri(accountName, appIssuer, secret);
}

/**
 * Genera un código QR en formato data URL
 */
export async function generateQrCodeDataURL(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('No se pudo generar el código QR');
  }
}

/**
 * Verifica un token TOTP
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({
      token,
      secret,
      window: 2, // Permitir tokens de las ventanas anterior y siguiente
    });
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
}

/**
 * Genera códigos de respaldo (backup codes)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generar códigos alfanuméricos de 8 caracteres
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verifica un código de respaldo
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  const normalizedCode = code.toUpperCase().trim();
  return backupCodes.includes(normalizedCode);
}

/**
 * Genera datos completos para la configuración TOTP
 */
export async function generateTOTPSetup(
  userEmail: string,
  issuer?: string
): Promise<TOTPSetupData> {
  const secret = generateSecret();
  const otpauthUri = generateOtpAuthUri(userEmail, secret, issuer);
  const qrCodeDataURL = await generateQrCodeDataURL(otpauthUri);
  const backupCodes = generateBackupCodes();

  return {
    secret,
    qrCodeDataURL,
    backupCodes,
  };
}

/**
 * Configura opciones TOTP personalizadas
 */
export function configureTOTPOptions(options: {
  step?: number;
  window?: number;
  digits?: number;
}) {
  if (options.step) authenticator.options.step = options.step;
  if (options.window) authenticator.options.window = options.window;
  if (options.digits) authenticator.options.digits = options.digits;
}