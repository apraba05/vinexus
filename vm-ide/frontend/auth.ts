import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
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

        let dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });

        // Auto-promote the owner email to "owner" role if not already set
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const isAdmin = !!(dbUser && adminEmail && dbUser.email?.toLowerCase().trim() === adminEmail);
        if (isAdmin && dbUser && dbUser.role !== "owner") {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: "owner" },
          });
        }

        (session as any).role = dbUser?.role || "user";
        (session as any).emailVerified = dbUser?.emailVerified || null;

        // Read plan directly from user record
        const planName = (dbUser as any)?.plan ?? "free";
        const planRecord = await prisma.plan.findUnique({ where: { name: planName } });
        (session as any).plan = planName;
        (session as any).features = planRecord?.features ?? {
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
