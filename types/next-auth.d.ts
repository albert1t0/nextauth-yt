import  { DefaultSession } from 'next-auth';
import "next-auth/jwt";

declare module 'next-auth' {

interface User {
    dni?: string;
    role?: string;
    isTwoFactorEnabled?: boolean;
    requiresTwoFactor?: boolean;
  }

  interface Session {
    user: User & {
      dni?: string;
      role?: string;
      isTwoFactorAuthenticated?: boolean;
      requiresTwoFactor?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dni?: string;
    role?: string;
    isTwoFactorAuthenticated?: boolean;
    requiresTwoFactor?: boolean;
  }
}