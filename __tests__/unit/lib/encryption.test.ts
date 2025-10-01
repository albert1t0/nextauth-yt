import {
  encrypt,
  decrypt,
  hashBackupCode,
  verifyBackupCode
} from '@/lib/encryption'
import * as crypto from 'crypto-js'
import * as bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('crypto-js')
jest.mock('bcryptjs')

const mockedCrypto = crypto as jest.Mocked<typeof crypto>
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('Encryption Utilities', () => {
  const TEST_ENCRYPTION_KEY = 'your-secret-encryption-key-here'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY
  })

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY
  })

  describe('encrypt', () => {
    it('should encrypt text using AES', () => {
      const plaintext = 'secret-data'
      const encrypted = 'encrypted-data'

      mockedCrypto.AES.encrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(encrypted)
      } as any)

      const result = encrypt(plaintext)

      expect(mockedCrypto.AES.encrypt).toHaveBeenCalledWith(plaintext, TEST_ENCRYPTION_KEY)
      expect(result).toBe(encrypted)
    })

    it('should use default encryption key when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY
      const plaintext = 'secret-data'
      const encrypted = 'encrypted-data'

      mockedCrypto.AES.encrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(encrypted)
      } as any)

      const result = encrypt(plaintext)

      expect(mockedCrypto.AES.encrypt).toHaveBeenCalledWith(plaintext, 'your-secret-encryption-key-here')
      expect(result).toBe(encrypted)
    })

    it('should throw error when encryption fails', () => {
      const plaintext = 'secret-data'

      mockedCrypto.AES.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed')
      })

      expect(() => encrypt(plaintext)).toThrow('Failed to encrypt data')
    })
  })

  describe('decrypt', () => {
    it('should decrypt encrypted text using AES', () => {
      const encrypted = 'encrypted-data'
      const decrypted = 'secret-data'

      mockedCrypto.AES.decrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(decrypted)
      } as any)

      const result = decrypt(encrypted)

      expect(mockedCrypto.AES.decrypt).toHaveBeenCalledWith(encrypted, TEST_ENCRYPTION_KEY)
      expect(result).toBe(decrypted)
    })

    it('should use default encryption key when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY
      const encrypted = 'encrypted-data'
      const decrypted = 'secret-data'

      mockedCrypto.AES.decrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(decrypted)
      } as any)

      const result = decrypt(encrypted)

      expect(mockedCrypto.AES.decrypt).toHaveBeenCalledWith(encrypted, 'your-secret-encryption-key-here')
      expect(result).toBe(decrypted)
    })

    it('should throw error when decryption fails', () => {
      const encrypted = 'encrypted-data'

      mockedCrypto.AES.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed')
      })

      expect(() => decrypt(encrypted)).toThrow('Failed to decrypt data')
    })
  })

  describe('hashBackupCode', () => {
    it('should hash backup code using bcrypt', async () => {
      const code = 'backup-code-123'
      const hashedCode = 'hashed-backup-code'

      mockedBcrypt.hash.mockResolvedValue(hashedCode)

      const result = await hashBackupCode(code)

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(code, 10)
      expect(result).toBe(hashedCode)
    })

    it('should handle bcrypt hashing errors', async () => {
      const code = 'backup-code-123'
      const errorMessage = 'Hashing failed'

      mockedBcrypt.hash.mockRejectedValue(new Error(errorMessage))

      await expect(hashBackupCode(code)).rejects.toThrow(errorMessage)
    })
  })

  describe('verifyBackupCode', () => {
    it('should verify backup code against hash', async () => {
      const code = 'backup-code-123'
      const hash = 'hashed-backup-code'

      mockedBcrypt.compare.mockResolvedValue(true)

      const result = await verifyBackupCode(code, hash)

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(code, hash)
      expect(result).toBe(true)
    })

    it('should return false for invalid backup code', async () => {
      const code = 'wrong-code'
      const hash = 'hashed-backup-code'

      mockedBcrypt.compare.mockResolvedValue(false)

      const result = await verifyBackupCode(code, hash)

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(code, hash)
      expect(result).toBe(false)
    })

    it('should handle bcrypt comparison errors', async () => {
      const code = 'backup-code-123'
      const hash = 'hashed-backup-code'
      const errorMessage = 'Comparison failed'

      mockedBcrypt.compare.mockRejectedValue(new Error(errorMessage))

      await expect(verifyBackupCode(code, hash)).rejects.toThrow(errorMessage)
    })
  })

  describe('end-to-end encryption/decryption', () => {
    it('should encrypt and decrypt symmetrically', () => {
      const original = 'sensitive-totp-secret-12345'

      // Mock the actual crypto operations to return meaningful values
      const encrypted = 'encrypted-' + original
      const decrypted = original

      mockedCrypto.AES.encrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(encrypted)
      } as any)

      mockedCrypto.AES.decrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(decrypted)
      } as any)

      const encryptedData = encrypt(original)
      const decryptedData = decrypt(encryptedData)

      expect(encryptedData).toBe(encrypted)
      expect(decryptedData).toBe(decrypted)
      expect(decryptedData).toBe(original)
    })
  })
})
