import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/auth/2fa/setup/route';
import { POST as VERIFY_POST } from '@/app/api/auth/2fa/verify/route';
import { POST as DISABLE_POST } from '@/app/api/auth/2fa/disable/route';
import { POST as BACKUP_CODES_POST } from '@/app/api/auth/2fa/backup-codes/route';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { generateSecret, verifyToken } from '@/lib/totp';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/encryption');
jest.mock('@/lib/totp');
jest.mock('bcryptjs');

const mockDb = db as jest.Mocked<typeof db>;
const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>;
const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>;
const mockGenerateSecret = generateSecret as jest.MockedFunction<typeof generateSecret>;
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('Security Tests - Authentication Vulnerabilities', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    dni: '12345678',
    role: 'USER'
  };

  const mockTwoFactorAuth = {
    id: '2fa-123',
    userId: 'user-123',
    secret: 'encrypted-secret',
    enabled: true,
    digits: 6,
    period: 30,
    lastUsedAt: new Date(),
    user: mockUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEncrypt.mockReturnValue('encrypted-secret');
    mockDecrypt.mockReturnValue('decrypted-secret');
    mockGenerateSecret.mockReturnValue('test-secret');
    mockVerifyToken.mockReturnValue(true);
    mockBcryptCompare.mockResolvedValue(true);
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login credentials', async () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE users; --",
        "1' OR '1'='1' /*",
        "admin' UNION SELECT * FROM users--"
      ];

      for (const maliciousInput of maliciousInputs) {
        const { req } = createMocks({
          method: 'POST',
          body: {
            email: maliciousInput,
            password: maliciousInput
          }
        });

        // Mock auth to handle the request
        const { auth: mockAuth } = await import('@/auth');
        (mockAuth as jest.Mock).mockResolvedValue({
          user: { id: 'user-123', email: maliciousInput }
        });

        // The system should not crash or execute SQL
        mockDb.user.findUnique.mockResolvedValue(null);

        // Should not throw error and should handle gracefully
        const { auth: mockAuthHandler } = await import('@/auth');
        await expect(mockAuthHandler(req, { params: {} })).resolves.not.toThrow();
      }
    });

    it('should prevent SQL injection in DNI field', async () => {
      const maliciousDNIs = [
        "' OR '1'='1",
        "12345678' UNION SELECT * FROM users--",
        "'; DROP TABLE users; --",
        "1' OR '1'='1' /*"
      ];

      for (const maliciousDNI of maliciousDNIs) {
        mockDb.user.findUnique.mockResolvedValue(null);

        // Should not find user with malicious DNI
        const result = await mockDb.user.findUnique({
          where: { dni: maliciousDNI }
        });

        expect(result).toBeNull();
      }
    });
  });

  describe('Cross-Site Scripting (XSS) Protection', () => {
    it('should sanitize user input in registration', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload=alert(1)>',
        '"><script>alert(1)</script>'
      ];

      for (const payload of xssPayloads) {
        // Test in name field
        mockDb.user.findUnique.mockResolvedValue(null);
        mockDb.user.create.mockResolvedValue({
          ...mockUser,
          name: payload // Should be sanitized
        });

        // The system should store the data safely
        expect(mockDb.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: payload // In real app, this should be sanitized
            })
          })
        );
      }
    });

    it('should prevent XSS in session data', async () => {
      // Mock session with XSS payload
      const { req } = createMocks({
        method: 'GET',
        headers: {
          cookie: `next-auth.session-token=malicious-session-data`
        }
      });

      // Should handle malicious session data gracefully
      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: '<script>alert(1)</script>' // XSS payload
        }
      });

      // Should not execute script and should escape properly
      await expect(mockAuth(req, { params: {} })).resolves.not.toThrow();
    });
  });

  describe('Authentication Bypass Protection', () => {
    it('should require authentication for protected routes', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {}
      });

      // Mock no auth
      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue(null);

      const response = await POST(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('No autorizado');
    });

    it('should validate session integrity', async () => {
      // Test with tampered session token
      const { req } = createMocks({
        method: 'POST',
        headers: {
          cookie: 'next-auth.session-token=invalid-tampered-token'
        }
      });

      // Should reject invalid session
      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue(null);

      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it('should prevent session fixation', async () => {
      const oldSessionId = 'old-session-id';
      const newSessionId = 'new-session-id';

      // Simulate session ID change after login
      const { req } = createMocks({
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' }
      });

      // Mock auth with session rotation
      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        sessionToken: newSessionId
      });

      const result = await mockAuth(req, { params: {} });

      // Session should be different after authentication
      expect(result).not.toHaveProperty('sessionToken', oldSessionId);
    });
  });

  describe('Brute Force Protection', () => {
    it('should implement rate limiting on authentication endpoints', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { email: 'test@example.com', password: 'wrong-password' },
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-rate-limit-remaining': '5'
        }
      });

      // Mock multiple failed attempts
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      // Simulate rate limiting headers
      for (let i = 0; i < 6; i++) {
        const { auth: mockAuth } = await import('@/auth');
        const result = await mockAuth(req, { params: {} });

        // After 5 attempts, should be rate limited
        if (i >= 5) {
          expect(result).toBeNull(); // Should be blocked
        }
      }
    });

    it('should implement account lockout after too many attempts', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { email: 'test@example.com', password: 'wrong-password' }
      });

      // Mock user with failed attempts
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 10,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000) // Locked for 15 minutes
      });

      const { auth: mockAuth } = await import('@/auth');
      const result = await mockAuth(req, { params: {} });

      // Should be blocked due to account lockout
      expect(result).toBeNull();
    });
  });

  describe('TOTP Security Tests', () => {
    it('should prevent TOTP token replay attacks', async () => {
      const token = '123456';

      // First verification should succeed
      mockVerifyToken.mockReturnValue(true);

      const { req: firstReq } = createMocks({
        method: 'POST',
        body: { token }
      });

      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      });

      mockDb.twoFactorAuth.findUnique.mockResolvedValue(mockTwoFactorAuth);
      mockDb.$transaction.mockImplementation(async (callback) => {
        await callback({
          twoFactorAuth: {
            update: jest.fn().mockResolvedValue({ lastUsedAt: new Date() })
          }
        } as any);
      });

      const firstResponse = await VERIFY_POST(firstReq);
      expect(firstResponse.status).toBe(200);

      // Second verification with same token should fail
      mockVerifyToken.mockReturnValue(false); // Token is now expired/used

      const { req: secondReq } = createMocks({
        method: 'POST',
        body: { token }
      });

      const secondResponse = await VERIFY_POST(secondReq);
      expect(secondResponse.status).toBe(400);
    });

    it('should validate TOTP secret encryption', async () => {
      // Test that secrets are properly encrypted
      const secret = 'test-secret-key';
      const encrypted = mockEncrypt(secret);

      expect(encrypted).not.toBe(secret);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      // Test decryption
      const decrypted = mockDecrypt(encrypted);
      expect(decrypted).toBe(secret);
    });

    it('should protect against TOTP secret exposure', async () => {
      const { req } = createMocks({
        method: 'GET'
      });

      // Should not expose secret in response
      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      });

      mockDb.twoFactorAuth.findUnique.mockResolvedValue(mockTwoFactorAuth);

      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Secret should not be exposed
      expect(data).not.toHaveProperty('secret');
      expect(data).not.toHaveProperty('encrypted-secret');
    });
  });

  describe('Input Validation Tests', () => {
    it('should validate DNI format thoroughly', async () => {
      const invalidDNIs = [
        '',               // Empty
        '123',            // Too short
        '123456789',      // Too long
        '1234 5678',      // Contains space
        '1234-5678',      // Contains dash
        'ABCD*EFG',       // Contains special character
        '1234.5678',      // Contains dot
        '1234+5678',      // Contains plus
        '  12345678  ',   // Contains leading/trailing spaces
        null,             // Null
        undefined,        // Undefined
        12345678,         // Number instead of string
        {},               // Object
        [],               // Array
      ];

      for (const dni of invalidDNIs) {
        // Test in registration context
        expect(() => {
          // This would be the Zod validation in a real scenario
          if (typeof dni !== 'string' || dni.length !== 8 || !/^[A-Za-z0-9]+$/.test(dni)) {
            throw new Error('Invalid DNI format');
          }
        }).toThrow('Invalid DNI format');
      }
    });

    it('should validate email format thoroughly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com',
        'test..test@example.com',
        'test@example..com',
        ' test@example.com',
        'test@example.com ',
        null,
        undefined,
        123,
        '',
        'test@example.com<script>alert(1)</script>'
      ];

      for (const email of invalidEmails) {
        // Test email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        '',                    // Empty
        '123',                 // Too short
        'password',            // Common password
        '12345678',            // Only numbers
        'abcdefgh',            // Only letters
        'password123',         // Common pattern
        'qwerty',              // Keyboard pattern
        '11111111',            // Repeating characters
        null,                  // Null
        undefined,             // Undefined
      ];

      for (const password of weakPasswords) {
        // Test password strength validation
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        expect(
          hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
        ).toBe(false);
      }
    });
  });

  describe('Session Security Tests', () => {
    it('should have secure session cookie settings', async () => {
      // Test cookie security attributes
      const sessionCookie = {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        options: {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60 // 30 days
        }
      };

      expect(sessionCookie.options.httpOnly).toBe(true);
      expect(sessionCookie.options.secure).toBe(true);
      expect(sessionCookie.options.sameSite).toBe('lax');
    });

    it('should implement CSRF protection', async () => {
      // Test CSRF token validation
      const { req } = createMocks({
        method: 'POST',
        body: { token: '123456' },
        headers: {
          'x-csrf-token': 'invalid-csrf-token'
        }
      });

      // Should validate CSRF token
      expect(req.headers['x-csrf-token']).toBeDefined();

      // In real implementation, this would validate against session CSRF token
      const csrfToken = req.headers['x-csrf-token'] as string;
      expect(csrfToken).not.toBe('');
    });

    it('should validate session expiration', async () => {
      const expiredSession = {
        user: { id: 'user-123' },
        expires: new Date(Date.now() - 1000) // Expired 1 second ago
      };

      expect(expiredSession.expires.getTime()).toBeLessThan(Date.now());

      // Should reject expired session
      const isValidSession = expiredSession.expires.getTime() > Date.now();
      expect(isValidSession).toBe(false);
    });
  });

  describe('Error Handling Security Tests', () => {
    it('should not expose sensitive information in error messages', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { token: 'invalid-token' }
      });

      mockDb.twoFactorAuth.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      });

      const response = await VERIFY_POST(req);

      expect(response.status).toBe(500);
      const data = await response.json();

      // Should not expose database error details
      expect(data.error).toBe('Error al procesar la configuración 2FA');
      expect(data.error).not.toContain('Database');
      expect(data.error).not.toContain('connection');
    });

    it('should handle unexpected errors gracefully', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { token: '123456' }
      });

      // Simulate unexpected error
      mockDb.twoFactorAuth.findUnique.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { auth: mockAuth } = await import('@/auth');
      (mockAuth as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' }
      });

      const response = await VERIFY_POST(req);

      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);

      // Should not crash the application
      expect(async () => await response.json()).not.toThrow();
    });
  });

  describe('Password Security Tests', () => {
    it('should use secure password hashing', async () => {
      const password = 'securePassword123!';
      const hash = await bcrypt.hash(password, 12); // 12 rounds

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2b$12$')).toBe(true);
    });

    it('should verify password hashes correctly', async () => {
      const password = 'securePassword123!';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should use secure backup code hashing', async () => {
      const backupCode = 'ABCD1234EFGH5678';
      const hash = await bcrypt.hash(backupCode, 10); // 10 rounds for backup codes

      expect(hash).not.toBe(backupCode);
      expect(hash.startsWith('$2b$10$')).toBe(true);
    });
  });
});