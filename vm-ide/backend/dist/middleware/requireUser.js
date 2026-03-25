"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = requireUser;
const prisma_1 = require("../lib/prisma");
const jose_1 = require("jose");
const hkdf_1 = require("@panva/hkdf");
// Must match NEXTAUTH_SECRET from the frontend .env
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "change-me-generate-with-openssl-rand-base64-32";
/**
 * Derive the encryption key the same way NextAuth v5 / Auth.js does.
 * Uses HKDF-SHA256 with the cookie name as salt.
 */
async function getDerivedEncryptionKey(secret, salt) {
    return await (0, hkdf_1.hkdf)("sha256", secret, salt, `Auth.js Generated Encryption Key (${salt})`, 64 // A256CBC-HS512 requires 64 bytes
    );
}
/**
 * Decrypt a NextAuth v5 JWE session cookie.
 */
async function decryptNextAuthToken(token, salt) {
    const encryptionSecret = await getDerivedEncryptionKey(NEXTAUTH_SECRET, salt);
    const { payload } = await (0, jose_1.jwtDecrypt)(token, encryptionSecret, {
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
async function requireUser(req, res, next) {
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
            if (!sessionToken)
                continue;
            // Handle chunked cookies (NextAuth splits large JWEs across multiple cookies)
            let fullToken = sessionToken;
            let chunkIndex = 0;
            while (cookies[`${cookieName}.${chunkIndex}`]) {
                if (chunkIndex === 0)
                    fullToken = "";
                fullToken += cookies[`${cookieName}.${chunkIndex}`];
                chunkIndex++;
            }
            try {
                // The salt is the cookie name itself
                const decoded = await decryptNextAuthToken(fullToken, cookieName);
                const userId = decoded?.id || decoded?.sub;
                if (userId) {
                    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
                    if (user) {
                        req.user = user;
                        return next();
                    }
                }
            }
            catch {
                // Try next cookie name
                continue;
            }
        }
        res.status(401).json({ error: "Authentication required" });
    }
    catch (error) {
        console.error("[requireUser] Error:", error);
        res.status(500).json({ error: "Authentication check failed" });
    }
}
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(";").forEach((cookie) => {
        const [key, ...rest] = cookie.trim().split("=");
        if (key) {
            cookies[key.trim()] = decodeURIComponent(rest.join("="));
        }
    });
    return cookies;
}
//# sourceMappingURL=requireUser.js.map