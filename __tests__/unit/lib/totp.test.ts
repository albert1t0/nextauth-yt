import {
  generateSecret,
  generateOtpAuthUri,
  generateQrCodeDataURL,
  verifyToken,
  generateBackupCodes
} from '@/lib/totp'
import { authenticator } from 'otplib'
import { toDataURL } from 'qrcode'
import { db } from '@/lib/db'

// Mock dependencies
jest.mock('otplib')
jest.mock('qrcode')
jest.mock('@/lib/db', () => ({
  db: {
    systemSettings: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}))

const mockedAuthenticator = authenticator as jest.Mocked<typeof authenticator>
const mockedToDataURL = toDataURL as unknown as jest.Mock
const mockDb = db as unknown as {
  systemSettings: {
    findFirst: jest.Mock
    create: jest.Mock
  }
}

describe('TOTP Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateSecret', () => {
    it('should call otplib authenticator generateSecret', () => {
      const mockSecret = 'test-secret-123'
      mockedAuthenticator.generateSecret.mockReturnValue(mockSecret)

      const result = generateSecret()

      expect(mockedAuthenticator.generateSecret).toHaveBeenCalled()
      expect(result).toBe(mockSecret)
    })

    it('should generate a unique secret each time', () => {
      const mockSecret1 = 'test-secret-123'
      const mockSecret2 = 'test-secret-456'
      
      mockedAuthenticator.generateSecret
        .mockReturnValueOnce(mockSecret1)
        .mockReturnValueOnce(mockSecret2)

      const secret1 = generateSecret()
      const secret2 = generateSecret()

      expect(secret1).toBeDefined()
      expect(secret2).toBeDefined()
      expect(secret1).not.toBe(secret2)
      expect(typeof secret1).toBe('string')
      expect(secret1.length).toBeGreaterThan(0)
    })
  })

  describe('generateOtpAuthUri', () => {
    beforeEach(() => {
      // Mock db response for all tests in this describe block
      mockDb.systemSettings.findFirst.mockResolvedValue({
        id: 'settings-1',
        totpIssuer: 'NextAuth App',
        totpDigits: 6,
        totpPeriod: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should generate correct otpauth URI with default issuer', async () => {
      const accountName = 'test@example.com'
      const secret = 'test-secret'
      const expectedUri = 'otpauth://totp/test@example.com?secret=test-secret&issuer=NextAuth%20App'

      mockedAuthenticator.keyuri.mockReturnValue(expectedUri)

      const result = await generateOtpAuthUri(accountName, secret)

      expect(mockedAuthenticator.keyuri).toHaveBeenCalledWith(accountName, 'NextAuth App', secret)
      expect(result).toBe(expectedUri)
    })

    it('should generate correct otpauth URI with custom issuer', async () => {
      const accountName = 'test@example.com'
      const secret = 'test-secret'
      const issuer = 'Custom App'
      const expectedUri = 'otpauth://totp/test@example.com?secret=test-secret&issuer=Custom%20App'

      mockedAuthenticator.keyuri.mockReturnValue(expectedUri)

      const result = await generateOtpAuthUri(accountName, secret, issuer)

      expect(mockedAuthenticator.keyuri).toHaveBeenCalledWith(accountName, issuer, secret)
      expect(result).toBe(expectedUri)
    })

    it('should handle special characters in account name', async () => {
      const accountName = 'test user@example.com'
      const secret = 'test-secret'
      const expectedUri = 'otpauth://totp/test%20user@example.com?secret=test-secret&issuer=NextAuth%20App'

      mockedAuthenticator.keyuri.mockReturnValue(expectedUri)

      const result = await generateOtpAuthUri(accountName, secret)

      expect(mockedAuthenticator.keyuri).toHaveBeenCalledWith(accountName, 'NextAuth App', secret)
      expect(result).toContain('otpauth://totp/test%20user@example.com')
      expect(result).toContain('secret=test-secret')
    })
  })

  describe('generateQrCodeDataURL', () => {
    it('should generate QR code data URL', async () => {
      const uri = 'otpauth://totp/test@example.com?secret=test'
      const expectedDataUrl = 'data:image/png;base64,test-qr-code'

      mockedToDataURL.mockResolvedValue(expectedDataUrl)

      const result = await generateQrCodeDataURL(uri)

      expect(mockedToDataURL).toHaveBeenCalledWith(uri, {
        width: 300,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      expect(result).toBe(expectedDataUrl)
    })

    it('should handle qrcode generation errors', async () => {
      const uri = 'otpauth://totp/test@example.com?secret=test'

      mockedToDataURL.mockRejectedValue(new Error('QR generation failed'))

      await expect(generateQrCodeDataURL(uri)).rejects.toThrow('No se pudo generar el código QR')
    })
  })

  describe('verifyToken', () => {
    beforeEach(() => {
      // Mock db response for all tests in this describe block
      mockDb.systemSettings.findFirst.mockResolvedValue({
        id: 'settings-1',
        totpIssuer: 'NextAuth App',
        totpDigits: 6,
        totpPeriod: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should verify valid token', async () => {
      const token = '123456'
      const secret = 'test-secret'

      mockedAuthenticator.verify.mockReturnValue(true)

      const result = await verifyToken(token, secret)

      expect(mockedAuthenticator.verify).toHaveBeenCalledWith({
        token,
        secret,
        window: 2,
      })
      expect(result).toBe(true)
    })

    it('should reject invalid token', async () => {
      const token = '000000'
      const secret = 'test-secret'

      mockedAuthenticator.verify.mockReturnValue(false)

      const result = await verifyToken(token, secret)

      expect(mockedAuthenticator.verify).toHaveBeenCalledWith({
        token,
        secret,
        window: 2,
      })
      expect(result).toBe(false)
    })
  })

  describe('generateBackupCodes', () => {
    it('should generate specified number of backup codes', () => {
      const count = 10
      const codes = generateBackupCodes(count)

      expect(codes).toHaveLength(count)
      codes.forEach(code => {
        expect(code).toBeDefined()
        expect(typeof code).toBe('string')
        expect(code.length).toBeGreaterThan(0)
      })
    })

    it('should generate unique backup codes', () => {
      const count = 10
      const codes = generateBackupCodes(count)
      const uniqueCodes = new Set(codes)

      expect(uniqueCodes.size).toBe(count)
    })

    it('should use default count when not specified', () => {
      const codes = generateBackupCodes()

      expect(codes).toHaveLength(10)
    })

    it('should generate codes with consistent format', () => {
      const codes = generateBackupCodes(5)

      codes.forEach(code => {
        // Backup codes should be alphanumeric
        expect(code).toMatch(/^[A-Za-z0-9]+$/)
      })
    })
  })

  describe('generateTOTPSetup', () => {
    beforeEach(() => {
      // Mock db response for all tests in this describe block
      mockDb.systemSettings.findFirst.mockResolvedValue({
        id: 'settings-1',
        totpIssuer: 'NextAuth App',
        totpDigits: 6,
        totpPeriod: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    // This function is not exported, so we test its components through other functions
    it('should work together with other functions', async () => {
      const mockSecret = 'test-secret-123'
      const mockQrData = 'data:image/png;base64,test'
      const mockUri = 'otpauth://totp/test@example.com?secret=test-secret-123&issuer=NextAuth%20App'

      mockedAuthenticator.generateSecret.mockReturnValue(mockSecret)
      mockedAuthenticator.keyuri.mockReturnValue(mockUri)
      mockedToDataURL.mockResolvedValue(mockQrData)

      const secret = generateSecret()
      const uri = await generateOtpAuthUri('test@example.com', secret)
      const qrCode = await generateQrCodeDataURL(uri)
      const backupCodes = generateBackupCodes(10)

      expect(secret).toBe(mockSecret)
      expect(uri).toContain('test@example.com')
      expect(uri).toContain(mockSecret)
      expect(qrCode).toBe(mockQrData)
      expect(backupCodes).toHaveLength(10)
    })
  })
})
