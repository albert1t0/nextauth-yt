import type { NextAuthConfig } from "next-auth"

import Credentials from "next-auth/providers/credentials"
 
// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
          console.log({credentials});
          if(credentials.email !== "test@test.com") {
            throw new Error("Invalid credentials");
          }
        return { 
          id: "1",
          name: "John Doe",
          email: "alberto@alberto.com"
        };
      },
    }),
  ],
} satisfies NextAuthConfig;