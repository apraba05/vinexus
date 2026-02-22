export { auth as middleware } from "./auth";

export const config = {
  matcher: ["/app/:path*", "/account/:path*", "/login", "/signup"],
};
