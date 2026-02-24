import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/app") ||
        nextUrl.pathname.startsWith("/account") ||
        nextUrl.pathname.startsWith("/dashboard");
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Configured in auth.ts (not edge-compatible)
};
