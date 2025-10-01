import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-here';

/**
 * Encrypts a string using AES encryption
 */
export function encrypt(text: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an AES encrypted string
 */
export function decrypt(encryptedText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hashes a string using bcrypt (for backup codes)
 * Note: This should be used server-side only
 */
export async function hashBackupCode(code: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(code, 10);
}

/**
 * Verifies a backup code against its hash
 */
export async function verifyBackupCode(code: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(code, hash);
}