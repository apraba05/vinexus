const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "frontend", ".next", "standalone", "runtime.env");

const defaults = {
  DESKTOP_AUTH_ORIGIN: process.env.DESKTOP_AUTH_ORIGIN || "https://vinexus.space",
};

const passthroughKeys = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "AUTH_SECRET",
  "ADMIN_EMAIL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_ID",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_ANNUAL",
  "STRIPE_PRICE_MAX_MONTHLY",
  "STRIPE_PRICE_MAX_ANNUAL",
  "STRIPE_PRICE_AI_PRO_MONTHLY",
  "STRIPE_PRICE_AI_PRO_ANNUAL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
];

const values = {
  ...defaults,
};

for (const key of passthroughKeys) {
  if (process.env[key]) {
    values[key] = process.env[key];
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value).replace(/\n/g, "")}`);
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Wrote runtime env to ${outputPath}`);
