import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        if (!email || typeof credentials.password !== "string") return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;

        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });

        (session as any).role = dbUser?.role || "user";
        (session as any).emailVerified = dbUser?.emailVerified || null;

        // Fetch subscription info
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: token.id as string,
            status: { in: ["active", "trialing"] },
          },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        });

        (session as any).plan = subscription?.plan?.name || "free";
        (session as any).features = subscription?.plan?.features || {
          ide: true,
          terminal: true,
          files: true,
          deploy: false,
          commands: false,
          ai: false,
        };
      }
      return session;
    },
  },
});
