import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  csvUserImportSchema,
  changePasswordSchema,
  totpVerificationSchema,
  totpSettingsSchema
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
        expect(result.error.issues[0].message).toContain('Email inválido')
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
        expect(result.error.issues[0].message).toContain('La contraseña debe tener más de 8 caracteres')
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
        expect(result.error.issues[0].message).toBe('La contraseña es requerida')
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
      const invalidCases: Array<{ value: string; expectedMessage: string }> = [
        { value: '1234567', expectedMessage: '8 caracteres alfanuméricos' },
        { value: '123456789', expectedMessage: '8 caracteres alfanuméricos' },
        { value: '123-4567', expectedMessage: '8 caracteres alfanuméricos' },
        { value: '1234567@', expectedMessage: '8 caracteres alfanuméricos' },
        { value: '', expectedMessage: 'El DNI es requerido' },
        { value: '  12345678', expectedMessage: '8 caracteres alfanuméricos' },
        { value: '12345678 ', expectedMessage: '8 caracteres alfanuméricos' },
      ]

      invalidCases.forEach(({ value, expectedMessage }) => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          dni: value,
          password: 'password123'
        }

        const result = registerSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          const message = result.error.issues[0].message
          expect(message).toContain(expectedMessage)
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
        expect(result.error.issues[0].message).toBe('El DNI es requerido')
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
        expect(result.error.issues[0].message).toContain('8 caracteres alfanuméricos')
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
          expect(result.data).toEqual({ ...validData, password: null })
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
        token: '123456',  // token is required, backupCode is optional
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
        token: ''  // empty token, no backup code
      }

      const result = totpVerificationSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El código es requerido')
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

  describe('totpSettingsSchema', () => {
    it('should validate correct TOTP settings', () => {
      const validData = {
        totpIssuer: 'MyApp',
        totpDigits: 6,
        totpPeriod: 30
      }

      const result = totpSettingsSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate TOTP settings with 8 digits', () => {
      const validData = {
        totpIssuer: 'SecureApp',
        totpDigits: 8,
        totpPeriod: 60
      }

      const result = totpSettingsSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate TOTP settings with maximum period', () => {
      const validData = {
        totpIssuer: 'TestApp',
        totpDigits: 6,
        totpPeriod: 1800
      }

      const result = totpSettingsSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid totpDigits values', () => {
      const invalidDigits = [5, 7, 9, 10, 0, -1]

      invalidDigits.forEach(digits => {
        const data = {
          totpIssuer: 'TestApp',
          totpDigits: digits,
          totpPeriod: 30
        }

        const result = totpSettingsSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Los dígitos deben ser 6 u 8')
        }
      })
    })

    it('should reject invalid totpPeriod values', () => {
      const invalidPeriods = [29, 1801, 0, -1, 3600]

      invalidPeriods.forEach(period => {
        const data = {
          totpIssuer: 'TestApp',
          totpDigits: 6,
          totpPeriod: period
        }

        const result = totpSettingsSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('El período debe estar entre 30 y 1800 segundos')
        }
      })
    })

    it('should reject empty totpIssuer', () => {
      const invalidData = {
        totpIssuer: '',
        totpDigits: 6,
        totpPeriod: 30
      }

      const result = totpSettingsSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El issuer es requerido')
      }
    })

    it('should reject totpIssuer that is too long', () => {
      const invalidData = {
        totpIssuer: 'A'.repeat(51), // 51 characters, max is 50
        totpDigits: 6,
        totpPeriod: 30
      }

      const result = totpSettingsSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('El issuer no puede exceder los 50 caracteres')
      }
    })

    it('should transform string numbers to actual numbers', () => {
      const stringData = {
        totpIssuer: 'TestApp',
        totpDigits: '6', // string that should be transformed to number
        totpPeriod: '30' // string that should be transformed to number
      }

      const result = totpSettingsSchema.safeParse(stringData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.totpDigits).toBe('number')
        expect(typeof result.data.totpPeriod).toBe('number')
        expect(result.data.totpDigits).toBe(6)
        expect(result.data.totpPeriod).toBe(30)
      }
    })

    it('should reject non-numeric strings for digits and period', () => {
      const invalidData = {
        totpIssuer: 'TestApp',
        totpDigits: 'invalid',
        totpPeriod: 'not-a-number'
      }

      const result = totpSettingsSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should require all fields', () => {
      const missingFields = [
        { totpIssuer: 'TestApp', totpDigits: 6 }, // missing totpPeriod
        { totpIssuer: 'TestApp', totpPeriod: 30 }, // missing totpDigits
        { totpDigits: 6, totpPeriod: 30 } // missing totpIssuer
      ]

      missingFields.forEach(data => {
        const result = totpSettingsSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })
    })
  })
})
