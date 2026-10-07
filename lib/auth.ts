import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) {
          return null;
        }

        const { email, password } = validated.data;
        const normalizedEmail = email.toLowerCase();

        // Rate limit check
        const rateLimitStatus = checkRateLimit(normalizedEmail);
        if (!rateLimitStatus.allowed) {
          throw new Error(
            `Too many failed attempts. Account locked. Please retry in ${rateLimitStatus.retryAfterSec} seconds.`
          );
        }

        const admin = await prisma.admin.findUnique({
          where: { email: normalizedEmail },
        });

        if (!admin) {
          recordFailedAttempt(normalizedEmail);
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!passwordsMatch) {
          recordFailedAttempt(normalizedEmail);
          return null;
        }

        // Reset rate limit on successful authentication
        resetRateLimit(normalizedEmail);

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours session
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
