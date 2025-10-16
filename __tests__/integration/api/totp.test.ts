import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/auth/2fa/setup/route'
import { POST as VERIFY_POST } from '@/app/api/auth/2fa/verify/route'
import { POST as DISABLE_POST } from '@/app/api/auth/2fa/disable/route'
import { POST as BACKUP_CODES_POST } from '@/app/api/auth/2fa/backup-codes/route'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/encryption'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/encryption')
jest.mock('@/auth')
jest.mock('bcryptjs')

const mockDb = db as any
const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>
const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>
const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockBcrypt = bcrypt as any

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

  // Helper to create Next.js compatible request
  const createNextRequest = (options: any) => {
    const { req } = createMocks(options)
    // Add json method to request for Next.js App Router compatibility
    req.json = jest.fn().mockResolvedValue(options.body || {})
    return req
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockEncrypt.mockReturnValue('encrypted-secret')
  })

  describe('POST /api/auth/2fa/setup', () => {
    it('should require authentication', async () => {
      const req = createNextRequest({
        method: 'POST',
        body: {}
      })

      // Mock auth to return no user
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await POST(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('No autorizado')
    })

    it('should return error if 2FA already enabled', async () => {
      const req = createNextRequest({
        method: 'POST',
        body: {}
      })

      // Mock authenticated user with 2FA enabled
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
      const req = createNextRequest({
        method: 'POST',
        body: {}
      })

      // Mock authenticated user
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
      const req = createNextRequest({
        method: 'POST',
        body: {}
      })

      // Mock authenticated user
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
      const req = createNextRequest({
        method: 'POST',
        body: verifyData
      })

      // Mock auth to return no user
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await VERIFY_POST(req)

      expect(response.status).toBe(401)
    })

    it('should validate request body', async () => {
      const req = createNextRequest({
        method: 'POST',
        body: { invalid: 'data' }
      })

      // Mock authenticated user
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      const response = await VERIFY_POST(req)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Datos inválidos')
    })

    it('should reject if 2FA not found', async () => {
      const req = createNextRequest({
        method: 'POST',
        body: verifyData
      })

      // Mock authenticated user
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
      const req = createNextRequest({
        method: 'POST',
        body: verifyData
      })

      // Mock authenticated user
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.twoFactorAuth.findUnique.mockResolvedValue({
        ...mockTwoFactorAuth,
        secret: 'corrupted-encrypted-data'
      })

      // Mock decrypt to throw error
      mockDecrypt.mockImplementation(() => {
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
      const req = createNextRequest({
        method: 'POST',
        body: disableData
      })

      // Mock auth to return no user
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await DISABLE_POST(req)

      expect(response.status).toBe(401)
    })

    it('should validate password', async () => {
      const req = createNextRequest({
        method: 'POST',
        body: disableData
      })

      // Mock authenticated user
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.user.findUnique.mockResolvedValue({
        password: 'hashed-password'
      })

      // Mock bcrypt compare to return false
      mockBcrypt.compare.mockResolvedValue(false)

      const response = await DISABLE_POST(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('La contraseña es incorrecta')
    })

    it('should disable 2FA and clean up data', async () => {
      const req = createNextRequest({
        method: 'POST',
        body: disableData
      })

      // Mock authenticated user
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.user.findUnique.mockResolvedValue({
        password: 'hashed-password'
      })

      // Mock successful password verification
      mockBcrypt.compare.mockResolvedValue(true)

      mockDb.twoFactorAuth.findUnique.mockResolvedValue({
        ...mockTwoFactorAuth,
        enabled: true
      })

      // Mock successful operations
      mockDb.$transaction.mockImplementation(async (callback: any) => {
        await callback({
          twoFactorAuth: {
            update: jest.fn().mockResolvedValue({})
          },
          backupCode: {
            deleteMany: jest.fn().mockResolvedValue({})
          }
        })
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
      const req = createNextRequest({
        method: 'POST',
        body: backupData
      })

      // Mock authenticated user
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      })

      mockDb.user.findUnique.mockResolvedValue({
        password: 'hashed-password'
      })

      // Mock successful password verification
      mockBcrypt.compare.mockResolvedValue(true)

      mockDb.twoFactorAuth.findUnique.mockResolvedValue({
        ...mockTwoFactorAuth,
        enabled: true
      })

      // Mock successful transaction
      const newBackupCodes = ['code1', 'code2', 'code3']
      mockDb.$transaction.mockImplementation(async (callback: any) => {
        await callback({
          backupCode: {
            deleteMany: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockResolvedValue({})
          }
        })
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
