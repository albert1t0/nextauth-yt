import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/auth/2fa/setup/route'
import { POST as VERIFY_POST } from '@/app/api/auth/2fa/verify/route'
import { POST as DISABLE_POST } from '@/app/api/auth/2fa/disable/route'
import { POST as BACKUP_CODES_POST } from '@/app/api/auth/2fa/backup-codes/route'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/encryption')
jest.mock('@/auth')

const mockDb = db as jest.Mocked<typeof db>
const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>

describe('TOTP API Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    twoFactorAuth: null
  }

  const mockTwoFactorAuth = {
    id: '2fa-123',
    userId: 'user-123',
    secret: 'encrypted-secret',
    enabled: false,
    digits: 6,
    period: 30,
    lastUsedAt: null,
    user: mockUser
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockEncrypt.mockReturnValue('encrypted-secret')
  })

  describe('POST /api/auth/2fa/setup', () => {
    it('should require authentication', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {}
      })

      // Mock auth to return no user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await POST(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('No autorizado')
    })

    it('should return error if 2FA already enabled', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {}
      })

      // Mock authenticated user with 2FA enabled
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', requiresTwoFactor: true }
      })

      mockDb.twoFactorAuth.findUnique.mockResolvedValue({
        ...mockTwoFactorAuth,
        enabled: true
      })

      const response = await POST(req)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('La autenticación de dos factores ya está habilitada')
    })

    it('should generate TOTP setup for user', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {}
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockDb.twoFactorAuth.findUnique.mockResolvedValue(null)

      // Mock successful upsert
      mockDb.twoFactorAuth.upsert.mockResolvedValue(mockTwoFactorAuth)

      const response = await POST(req)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.qrCodeDataURL).toBeDefined()
      expect(data.backupCodes).toBeDefined()
      expect(data.message).toBe('Escanea el código QR con tu aplicación de autenticación')

      expect(mockDb.twoFactorAuth.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          secret: 'encrypted-secret',
          enabled: false
        },
        create: {
          userId: 'user-123',
          secret: 'encrypted-secret',
          enabled: false,
          digits: 6,
          period: 30
        }
      })
    })

    it('should handle database errors', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {}
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockDb.twoFactorAuth.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Error al configurar la autenticación de dos factores')
    })
  })

  describe('POST /api/auth/2fa/verify', () => {
    const verifyData = {
      token: '123456',
      backupCode: undefined
    }

    it('should require authentication', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: verifyData
      })

      // Mock auth to return no user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await VERIFY_POST(req)

      expect(response.status).toBe(401)
    })

    it('should validate request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { invalid: 'data' }
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      const response = await VERIFY_POST(req)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Datos inválidos')
    })

    it('should reject if 2FA not found', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: verifyData
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.twoFactorAuth.findUnique.mockResolvedValue(null)

      const response = await VERIFY_POST(req)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('No se encontró configuración 2FA')
    })

    it('should handle decryption errors', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: verifyData
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.twoFactorAuth.findUnique.mockResolvedValue({
        ...mockTwoFactorAuth,
        secret: 'corrupted-encrypted-data'
      })

      // Mock decrypt to throw error
      const { decrypt } = await import('@/lib/encryption')
      ;(decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed')
      })

      const response = await VERIFY_POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Error al procesar la configuración 2FA')
    })
  })

  describe('POST /api/auth/2fa/disable', () => {
    const disableData = {
      password: 'user-password'
    }

    it('should require authentication', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: disableData
      })

      // Mock auth to return no user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await DISABLE_POST(req)

      expect(response.status).toBe(401)
    })

    it('should validate password', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: disableData
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.user.findUnique.mockResolvedValue({
        password: 'hashed-password'
      })

      // Mock bcrypt compare to return false
      const bcrypt = await import('bcryptjs')
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const response = await DISABLE_POST(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('La contraseña es incorrecta')
    })

    it('should disable 2FA and clean up data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: disableData
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.user.findUnique.mockResolvedValue({
        password: 'hashed-password'
      })

      // Mock successful password verification
      const bcrypt = await import('bcryptjs')
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      mockDb.twoFactorAuth.findUnique.mockResolvedValue(mockTwoFactorAuth)

      // Mock successful operations
      mockDb.$transaction.mockImplementation(async (callback) => {
        await callback({
          twoFactorAuth: {
            update: jest.fn().mockResolvedValue({})
          },
          backupCode: {
            deleteMany: jest.fn().mockResolvedValue({})
          }
        } as any)
      })

      const response = await DISABLE_POST(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Autenticación de dos factores deshabilitada correctamente')

      expect(mockDb.$transaction).toHaveBeenCalled()
    })
  })

  describe('POST /api/auth/2fa/backup-codes', () => {
    const backupData = {
      password: 'user-password'
    }

    it('should generate new backup codes', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: backupData
      })

      // Mock authenticated user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.user.findUnique.mockResolvedValue({
        password: 'hashed-password'
      })

      // Mock successful password verification
      const bcrypt = await import('bcryptjs')
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      mockDb.twoFactorAuth.findUnique.mockResolvedValue({
        ...mockTwoFactorAuth,
        enabled: true
      })

      // Mock successful transaction
      const newBackupCodes = ['code1', 'code2', 'code3']
      mockDb.$transaction.mockImplementation(async (callback) => {
        await callback({
          backupCode: {
            deleteMany: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockResolvedValue({})
          }
        } as any)
        return newBackupCodes
      })

      const response = await BACKUP_CODES_POST(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.backupCodes).toBeDefined()
      expect(Array.isArray(data.backupCodes)).toBe(true)
    })
  })
})