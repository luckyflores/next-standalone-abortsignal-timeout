/**
 * Full Auth.js (NextAuth v5 beta) instance with a Credentials provider —
 * mirrors nocmon's auth.ts minus argon2/Prisma.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (creds && creds.password === 'letmein') {
          return { id: '1', email: String(creds.email ?? 'x@example.com') };
        }
        return null;
      },
    }),
  ],
});
