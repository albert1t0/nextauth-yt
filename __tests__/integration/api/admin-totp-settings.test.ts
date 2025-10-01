import { createMocks } from 'node-mocks-http'
import { GET, PUT } from '@/app/api/admin/settings/totp/route'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/auth')

const mockDb = db as jest.Mocked<typeof db>

describe('Admin TOTP Settings API Endpoints', () => {
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin'
  }

  const mockRegularUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user'
  }

  const mockSystemSettings = {
    id: 'settings-123',
    totpIssuer: 'MyApp',
    totpDigits: 6,
    totpPeriod: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/settings/totp', () => {
    it('should require admin role', async () => {
      const { req } = createMocks({
        method: 'GET'
      })

      // Mock auth to return regular user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockRegularUser
      })

      const response = await GET(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should require authentication', async () => {
      const { req } = createMocks({
        method: 'GET'
      })

      // Mock auth to return no user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await GET(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return existing settings when they exist', async () => {
      const { req } = createMocks({
        method: 'GET'
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockResolvedValue(mockSystemSettings)

      const response = await GET(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        totpIssuer: 'MyApp',
        totpDigits: 6,
        totpPeriod: 30
      })

      expect(mockDb.systemSettings.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' }
      })
    })

    it('should create default settings when none exist', async () => {
      const { req } = createMocks({
        method: 'GET'
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      // Mock no existing settings
      mockDb.systemSettings.findFirst.mockResolvedValue(null)

      // Mock creation of default settings
      const defaultSettings = {
        ...mockSystemSettings,
        id: 'new-settings-123'
      }
      mockDb.systemSettings.create.mockResolvedValue(defaultSettings)

      const response = await GET(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        totpIssuer: 'MyApp',
        totpDigits: 6,
        totpPeriod: 30
      })

      expect(mockDb.systemSettings.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' }
      })
      expect(mockDb.systemSettings.create).toHaveBeenCalledWith({
        data: {
          totpIssuer: 'MyApp',
          totpDigits: 6,
          totpPeriod: 30
        }
      })
    })

    it('should handle database errors', async () => {
      const { req } = createMocks({
        method: 'GET'
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockRejectedValue(new Error('Database error'))

      const response = await GET(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/admin/settings/totp', () => {
    const validUpdateData = {
      totpIssuer: 'UpdatedApp',
      totpDigits: 8,
      totpPeriod: 60
    }

    it('should require admin role', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: validUpdateData
      })

      // Mock auth to return regular user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockRegularUser
      })

      const response = await PUT(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should require authentication', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: validUpdateData
      })

      // Mock auth to return no user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue(null)

      const response = await PUT(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate request body', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: {
          totpIssuer: '', // invalid: empty
          totpDigits: 5, // invalid: not 6 or 8
          totpPeriod: 29 // invalid: below minimum
        }
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      const response = await PUT(req)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('should update existing settings', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: validUpdateData
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockResolvedValue(mockSystemSettings)

      const updatedSettings = {
        ...mockSystemSettings,
        ...validUpdateData
      }
      mockDb.systemSettings.update.mockResolvedValue(updatedSettings)

      const response = await PUT(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(validUpdateData)

      expect(mockDb.systemSettings.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' }
      })
      expect(mockDb.systemSettings.update).toHaveBeenCalledWith({
        where: { id: mockSystemSettings.id },
        data: validUpdateData
      })
    })

    it('should create settings when none exist', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: validUpdateData
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockResolvedValue(null)

      const newSettings = {
        ...mockSystemSettings,
        id: 'new-settings-123',
        ...validUpdateData
      }
      mockDb.systemSettings.create.mockResolvedValue(newSettings)

      const response = await PUT(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(validUpdateData)

      expect(mockDb.systemSettings.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' }
      })
      expect(mockDb.systemSettings.create).toHaveBeenCalledWith({
        data: validUpdateData
      })
    })

    it('should handle database errors during update', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: validUpdateData
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockResolvedValue(mockSystemSettings)
      mockDb.systemSettings.update.mockRejectedValue(new Error('Database error'))

      const response = await PUT(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle database errors during creation', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: validUpdateData
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockResolvedValue(null)
      mockDb.systemSettings.create.mockRejectedValue(new Error('Database error'))

      const response = await PUT(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should transform string numbers to actual numbers', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: {
          totpIssuer: 'TestApp',
          totpDigits: '6', // string that should be transformed
          totpPeriod: '30' // string that should be transformed
        }
      })

      // Mock admin user
      const { auth: mockAuth } = await import('@/auth')
      ;(mockAuth as jest.Mock).mockResolvedValue({
        user: mockAdminUser
      })

      mockDb.systemSettings.findFirst.mockResolvedValue(mockSystemSettings)

      const transformedData = {
        totpIssuer: 'TestApp',
        totpDigits: 6,
        totpPeriod: 30
      }
      mockDb.systemSettings.update.mockResolvedValue({
        ...mockSystemSettings,
        ...transformedData
      })

      const response = await PUT(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(transformedData)

      expect(mockDb.systemSettings.update).toHaveBeenCalledWith({
        where: { id: mockSystemSettings.id },
        data: transformedData
      })
    })
  })
})