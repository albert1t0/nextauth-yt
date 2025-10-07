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

  const mockNextAuth = jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
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
  }
})

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

// Mock crypto-js - will be configured in individual tests

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