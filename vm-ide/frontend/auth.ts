import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";
import { authConfig } from "./auth.config";
import { DEFAULT_FEATURES, getUserPlanState } from "./lib/planState";

const providers = [];

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...providers,
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
        // Cache the role in the JWT so it's available without a DB lookup on every request
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Backfill token.id for sessions created before the jwt callback set it.
      // token.email is always present so we can resolve the user id from the DB.
      let userId = token.id as string | undefined;
      if (!userId && token.email) {
        const found = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true },
        });
        if (found) userId = found.id;
      }

      if (userId) {
        session.user.id = userId;

        const planState = await getUserPlanState(userId);
        let dbUser = planState.user;

        // Auto-promote the owner email to "owner" role if not already set
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const isAdmin = !!(dbUser && adminEmail && dbUser.email?.toLowerCase().trim() === adminEmail);
        if (isAdmin && dbUser && dbUser.role !== "owner") {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: "owner" },
          });
        }

        // Prefer the live DB role; fall back to what was cached in the JWT token
        (session as any).role = dbUser?.role || (token.role as string) || "user";
        (session as any).emailVerified = dbUser?.emailVerified || null;
        (session as any).plan = planState.planKey;
        (session as any).features = planState.features;
      }
      return session;
    },
  },
});
