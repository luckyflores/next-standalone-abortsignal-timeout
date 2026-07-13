/**
 * Edge-safe Auth.js config — mirrors nocmon's auth.config.ts (used by the
 * middleware; providers live in auth.ts on the Node side).
 */
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
};
