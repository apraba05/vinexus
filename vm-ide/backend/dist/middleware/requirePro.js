"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePro = requirePro;
const prisma_1 = require("../lib/prisma");
/**
 * Middleware that checks if the authenticated user has an active Pro subscription.
 * Must be used AFTER requireUser middleware.
 * Returns 402 Payment Required if the user is on the Free plan.
 */
async function requirePro(req, res, next) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const subscription = await prisma_1.prisma.subscription.findFirst({
            where: {
                userId: user.id,
                status: { in: ["active", "trialing"] },
            },
            include: { plan: true },
        });
        if (subscription && subscription.plan.name === "pro") {
            req.subscription = subscription;
            return next();
        }
        res.status(402).json({
            error: "Pro subscription required",
            upgradeUrl: `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/pricing`,
        });
    }
    catch (error) {
        console.error("[requirePro] Error:", error);
        res.status(500).json({ error: "Subscription check failed" });
    }
}
//# sourceMappingURL=requirePro.js.map