import '@testing-library/jest-dom'

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

// Mock next-auth
jest.mock('next-auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'test-user-id' } })),
  signIn: jest.fn(),
  signOut: jest.fn(),
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
    check: jest.fn(() => true),
    generate: jest.fn(() => '123456'),
  },
}))

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({
      toString: jest.fn(() => 'encrypted-data'),
    })),
    decrypt: jest.fn(() => ({
      toString: jest.fn(() => 'decrypted-data'),
    })),
  },
  enc: {
    Utf8: 'utf8',
  },
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