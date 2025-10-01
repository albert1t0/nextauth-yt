import { z } from 'zod'
import {
  loginSchema,
  registerSchema,
  updateUserRoleSchema,
  updateProfileSchema,
  csvUserImportSchema,
  changePasswordSchema,
  totpVerificationSchema
} from '@/lib/zod'

describe('Zod Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = loginSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }

      const result = loginSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email')
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short'
      }

      const result = loginSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password must be more than 8 characters')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
        // missing password
      }

      const result = loginSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required')
      }
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data with DNI', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        dni: '12345678',
        password: 'password123'
      }

      const result = registerSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate DNI format', () => {
      const validDnis = [
        '12345678',
        'ABCD1234',
        '00000000',
        'ZZZZ9999'
      ]

      validDnis.forEach(dni => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          dni,
          password: 'password123'
        }

        const result = registerSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid DNI formats', () => {
      const invalidDnis = [
        '1234567',  // too short
        '123456789', // too long
        '123-4567', // contains hyphen
        '1234567A', // invalid characters
        '',         // empty
        '  12345678', // has spaces
        '12345678 '  // has trailing spaces
      ]

      invalidDnis.forEach(dni => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          dni,
          password: 'password123'
        }

        const result = registerSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('DNI must be exactly 8 alphanumeric characters')
        }
      })
    })

    it('should reject missing DNI', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
        // missing dni
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('DNI is required')
      }
    })
  })

  describe('updateProfileSchema', () => {
    it('should accept valid profile update data', () => {
      const validData = {
        name: 'Updated Name',
        dni: '87654321'
      }

      const result = updateProfileSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should accept partial updates', () => {
      const partialData = {
        name: 'Updated Name'
        // dni is optional
      }

      const result = updateProfileSchema.safeParse(partialData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Name')
        expect(result.data.dni).toBeUndefined()
      }
    })

    it('should validate DNI when provided', () => {
      const invalidData = {
        name: 'Updated Name',
        dni: 'invalid-dni'
      }

      const result = updateProfileSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('DNI must be exactly 8 alphanumeric characters')
      }
    })
  })

  describe('csvUserImportSchema', () => {
    it('should validate CSV import data with DNI', () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        dni: '11223344',
        role: 'user'
      }

      const result = csvUserImportSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should require DNI for CSV import', () => {
      const data = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user'
        // missing dni
      }

      const result = csvUserImportSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El DNI es requerido')
      }
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate password change data', () => {
      const validData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }

      const result = changePasswordSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should require passwords to match', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      }

      const result = changePasswordSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Las contraseñas no coinciden')
      }
    })

    it('should require different new password', () => {
      const invalidData = {
        currentPassword: 'password123',
        newPassword: 'password123',
        confirmPassword: 'password123'
      }

      const result = changePasswordSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La nueva contraseña debe ser diferente a la actual')
      }
    })
  })

  describe('totpVerificationSchema', () => {
    it('should validate TOTP token', () => {
      const validData = {
        token: '123456'
      }

      const result = totpVerificationSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate backup code', () => {
      const validData = {
        backupCode: 'ABCD1234'
      }

      const result = totpVerificationSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid TOTP token format', () => {
      const invalidTokens = [
        '12345',  // too short
        '1234567', // too long
        'abcdef',  // non-numeric
        ' 123456', // has spaces
        '123456 '  // has trailing spaces
      ]

      invalidTokens.forEach(token => {
        const data = { token }
        const result = totpVerificationSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('El código debe tener exactamente 6 dígitos')
        }
      })
    })

    it('should require either token or backup code', () => {
      const data = {
        // neither token nor backup code
      }

      const result = totpVerificationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Se requiere un código TOTP o un código de respaldo')
      }
    })

    it('should accept both token and backup code', () => {
      const data = {
        token: '123456',
        backupCode: 'ABCD1234'
      }

      const result = totpVerificationSchema.safeParse(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.token).toBe('123456')
        expect(result.data.backupCode).toBe('ABCD1234')
      }
    })
  })
})