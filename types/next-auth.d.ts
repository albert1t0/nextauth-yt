import  { DefaultSession } from 'next-auth';
import "next-auth/jwt";

declare module 'next-auth' {

interface User {
    dni?: string | null;
    role?: string;
    isTwoFactorEnabled?: boolean;
    isTwoFactorForced?: boolean;
    requiresTwoFactor?: boolean;
    needs2FASetup?: boolean;
  }

  interface Session {
    user: User & {
      dni?: string | null;
      role?: string;
      isTwoFactorAuthenticated?: boolean;
      requiresTwoFactor?: boolean;
      needs2FASetup?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dni?: string | null;
    role?: string;
    isTwoFactorAuthenticated?: boolean;
    requiresTwoFactor?: boolean;
    needs2FASetup?: boolean;
  }
}