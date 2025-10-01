import {
  generateSecret,
  generateOtpAuthUri,
  generateQrCodeDataURL,
  verifyToken,
  generateBackupCodes
} from '@/lib/totp'
import { authenticator } from 'otplib'
import { toDataURL } from 'qrcode'

// Mock dependencies
jest.mock('otplib')
jest.mock('qrcode')

const mockedAuthenticator = authenticator as jest.Mocked<typeof authenticator>
const mockedToDataURL = toDataURL as jest.MockedFunction<typeof toDataURL>

describe('TOTP Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateSecret', () => {
    it('should generate a unique secret each time', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()

      expect(secret1).toBeDefined()
      expect(secret2).toBeDefined()
      expect(secret1).not.toBe(secret2)
      expect(typeof secret1).toBe('string')
      expect(secret1.length).toBeGreaterThan(0)
    })

    it('should call otplib authenticator generateSecret', () => {
      const mockSecret = 'test-secret-123'
      mockedAuthenticator.generateSecret.mockReturnValue(mockSecret)

      const result = generateSecret()

      expect(mockedAuthenticator.generateSecret).toHaveBeenCalled()
      expect(result).toBe(mockSecret)
    })
  })

  describe('generateOtpAuthUri', () => {
    it('should generate correct otpauth URI with default issuer', () => {
      const accountName = 'test@example.com'
      const secret = 'test-secret'
      const expectedUri = 'otpauth://totp/test@example.com?secret=test-secret&issuer=NextAuth%20App'

      const result = generateOtpAuthUri(accountName, secret)

      expect(result).toBe(expectedUri)
    })

    it('should generate correct otpauth URI with custom issuer', () => {
      const accountName = 'test@example.com'
      const secret = 'test-secret'
      const issuer = 'Custom App'
      const expectedUri = 'otpauth://totp/test@example.com?secret=test-secret&issuer=Custom%20App'

      const result = generateOtpAuthUri(accountName, secret, issuer)

      expect(result).toBe(expectedUri)
    })

    it('should handle special characters in account name', () => {
      const accountName = 'test user@example.com'
      const secret = 'test-secret'
      const result = generateOtpAuthUri(accountName, secret)

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

      expect(mockedToDataURL).toHaveBeenCalledWith(uri)
      expect(result).toBe(expectedDataUrl)
    })

    it('should handle qrcode generation errors', async () => {
      const uri = 'otpauth://totp/test@example.com?secret=test'
      const errorMessage = 'QR generation failed'

      mockedToDataURL.mockRejectedValue(new Error(errorMessage))

      await expect(generateQrCodeDataURL(uri)).rejects.toThrow(errorMessage)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = '123456'
      const secret = 'test-secret'

      mockedAuthenticator.check.mockReturnValue(true)

      const result = verifyToken(token, secret)

      expect(mockedAuthenticator.check).toHaveBeenCalledWith(token, secret)
      expect(result).toBe(true)
    })

    it('should reject invalid token', () => {
      const token = '000000'
      const secret = 'test-secret'

      mockedAuthenticator.check.mockReturnValue(false)

      const result = verifyToken(token, secret)

      expect(mockedAuthenticator.check).toHaveBeenCalledWith(token, secret)
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
    // This function is not exported, so we test its components through other functions
    it('should work together with other functions', async () => {
      const mockSecret = 'test-secret'
      const mockQrData = 'data:image/png;base64,test'

      mockedAuthenticator.generateSecret.mockReturnValue(mockSecret)
      mockedToDataURL.mockResolvedValue(mockQrData)

      const secret = generateSecret()
      const uri = generateOtpAuthUri('test@example.com', secret)
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