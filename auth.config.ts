import type { NextAuthConfig } from "next-auth"

import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/zod";
import { db } from "@/lib/db";

 
// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [
    Credentials({
      authorize: async (credentials) => {
      
        // Here you would look up the user from the credentials
        // For example, you might fetch the user from a database
        // and return the user object if found, or null if not found.
        const { data, success } = loginSchema.safeParse(credentials);

        if (!success) {
          throw new Error("Invalid credentials");
        }

      },
    }),
  ],
} satisfies NextAuthConfig;