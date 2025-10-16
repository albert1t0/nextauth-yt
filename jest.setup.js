// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/test-path'
  },
}))

// Mock next-auth and its Prisma adapter integration
jest.mock('next-auth', () => {
  const authFn = jest.fn(() => Promise.resolve({ user: { id: 'test-user-id' } }))
  const signIn = jest.fn()
  const signOut = jest.fn()
  const handlers = { GET: jest.fn(), POST: jest.fn() }

  const mockNextAuth = jest.fn(() => ({
    handlers,
    auth: authFn,
    signIn,
    signOut,
  }))

  return {
    __esModule: true,
    default: mockNextAuth,
    auth: authFn,
    signIn,
    signOut,
    handlers,
  }
})

// Mock next-auth providers
jest.mock('next-auth/providers/credentials', () => ({
  Credentials: jest.fn(() => ({
    authorize: jest.fn()
  }))
}))

// Mock auth.config.ts
jest.mock('@/auth.config', () => ({
  providers: [
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      authorize: jest.fn()
    }
  ],
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session }) {
      return session
    }
  }
}))

jest.mock('@auth/prisma-adapter', () => ({
  __esModule: true,
  PrismaAdapter: jest.fn(() => ({})),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
  hash: jest.fn(() => Promise.resolve('hashed-password')),
}))

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,test')),
}))

// Mock otplib
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'test-secret'),
    verify: jest.fn(() => true),
    generate: jest.fn(() => '123456'),
    keyuri: jest.fn(() => 'otpauth://totp/test@example.com?secret=test'),
  },
}))

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({
      toString: jest.fn(() => 'encrypted-string')
    })),
    decrypt: jest.fn(() => ({
      toString: jest.fn(() => 'decrypted-string')
    }))
  },
  enc: {
    Utf8: jest.fn()
  }
}))

// Mock @sendgrid/mail
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(() => Promise.resolve([{ statusCode: 200 }]))
}))

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Setup global test utilities
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }
}

// Mock database with all required properties
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    twoFactorAuth: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    backupCode: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    systemSettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock system settings for TOTP
jest.mock('@/lib/totp', () => ({
  generateTOTPSetup: jest.fn(() => ({
    secret: 'test-secret',
    qrCodeDataURL: 'data:image/png;base64,test',
    backupCodes: ['123456', '789012', '345678']
  })),
  verifyTOTPToken: jest.fn(() => true),
  generateBackupCodes: jest.fn(() => ['123456', '789012', '345678']),
  configureTOTPFromSystemSettings: jest.fn(() => Promise.resolve({
    totpIssuer: 'TestApp',
    totpDigits: 6,
    totpPeriod: 30,
    totpWindow: 1
  }))
}))
