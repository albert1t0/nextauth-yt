import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from './db';

// Configuración de TOTP inicial por defecto
authenticator.options = {
  step: 30, // 30 segundos por defecto
  window: 1, // ventana de verificación (token actual y anterior)
  digits: 6, // 6 dígitos por defecto
};

interface TOTPSystemSettings {
  totpIssuer: string;
  totpDigits: number;
  totpPeriod: number;
}

/**
 * Obtiene las configuraciones TOTP del sistema desde la base de datos
 */
export async function getSystemSettings(): Promise<TOTPSystemSettings> {
  try {
    let settings = await db.systemSettings.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          totpIssuer: 'MyApp',
          totpDigits: 6,
          totpPeriod: 30,
        }
      });
    }

    return {
      totpIssuer: settings.totpIssuer,
      totpDigits: settings.totpDigits,
      totpPeriod: settings.totpPeriod,
    };
  } catch (error) {
    console.error('Error fetching TOTP system settings:', error);
    // Retornar valores por defecto si hay error
    return {
      totpIssuer: process.env.NEXT_PUBLIC_APP_NAME || 'MyApp',
      totpDigits: 6,
      totpPeriod: 30,
    };
  }
}

/**
 * Configura las opciones TOTP basadas en los settings del sistema
 */
export async function configureTOTPFromSystemSettings() {
  const settings = await getSystemSettings();

  authenticator.options = {
    step: settings.totpPeriod,
    window: 2, // Permitir tokens de las ventanas anterior y siguiente
    digits: settings.totpDigits,
  } as any; // Usamos any para evitar problemas de tipos con la librería otplib
}

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
export async function generateOtpAuthUri(
  accountName: string,
  secret: string,
  issuer?: string
): Promise<string> {
  const settings = await getSystemSettings();
  const appIssuer = issuer || settings.totpIssuer;
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
export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    // Asegurarse de que la configuración esté actualizada
    await configureTOTPFromSystemSettings();

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
  // Asegurarse de que la configuración esté actualizada
  await configureTOTPFromSystemSettings();

  const secret = generateSecret();
  const otpauthUri = await generateOtpAuthUri(userEmail, secret, issuer);
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