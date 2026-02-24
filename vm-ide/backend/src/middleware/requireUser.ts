import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";

// Must match NEXTAUTH_SECRET from the frontend .env
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "change-me-generate-with-openssl-rand-base64-32";

/**
 * Derive the encryption key the same way NextAuth v5 / Auth.js does.
 * Uses HKDF-SHA256 with the cookie name as salt.
 */
async function getDerivedEncryptionKey(secret: string, salt: string): Promise<Uint8Array> {
  return await hkdf(
    "sha256",
    secret,
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    64 // A256CBC-HS512 requires 64 bytes
  );
}

/**
 * Decrypt a NextAuth v5 JWE session cookie.
 */
async function decryptNextAuthToken(token: string, salt: string): Promise<any> {
  const encryptionSecret = await getDerivedEncryptionKey(NEXTAUTH_SECRET, salt);
  const { payload } = await jwtDecrypt(token, encryptionSecret, {
    clockTolerance: 15,
    keyManagementAlgorithms: ["dir"],
    contentEncryptionAlgorithms: ["A256CBC-HS512", "A256GCM"],
  });
  return payload;
}

/**
 * Middleware that validates the user from NextAuth v5 JWE session cookie.
 * NextAuth v5 uses encrypted JWTs (JWE), not signed JWTs.
 * Attaches req.user with the user record if found.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie || "");

    // NextAuth v5 uses "authjs.session-token" prefix (not "next-auth")
    // Check multiple possible cookie names
    const cookieNames = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
    ];

    for (const cookieName of cookieNames) {
      const sessionToken = cookies[cookieName];
      if (!sessionToken) continue;

      // Handle chunked cookies (NextAuth splits large JWEs across multiple cookies)
      let fullToken = sessionToken;
      let chunkIndex = 0;
      while (cookies[`${cookieName}.${chunkIndex}`]) {
        if (chunkIndex === 0) fullToken = "";
        fullToken += cookies[`${cookieName}.${chunkIndex}`];
        chunkIndex++;
      }

      try {
        // The salt is the cookie name itself
        const decoded = await decryptNextAuthToken(fullToken, cookieName);
        const userId = decoded?.id || decoded?.sub;
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            (req as any).user = user;
            return next();
          }
        }
      } catch {
        // Try next cookie name
        continue;
      }
    }

    res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    console.error("[requireUser] Error:", error);
    res.status(500).json({ error: "Authentication check failed" });
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...rest] = cookie.trim().split("=");
    if (key) {
      cookies[key.trim()] = decodeURIComponent(rest.join("="));
    }
  });
  return cookies;
}
