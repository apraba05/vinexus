import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDesktopShell = nextUrl.searchParams.get("desktop") === "1";
      const isProtected =
        nextUrl.pathname.startsWith("/app") ||
        nextUrl.pathname.startsWith("/account") ||
        nextUrl.pathname.startsWith("/dashboard");
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

      // The desktop app owns its own sign-in screen under /app, so allow
      // unauthenticated access there when Electron opens the desktop shell.
      if (isProtected && !isLoggedIn && !isDesktopShell) {
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
