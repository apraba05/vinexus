import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "noreply@infranexus.com";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${getAppUrl()}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Reset your InfraNexus password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fafafa; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset for your InfraNexus account. Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 28px; background: #06b6d4; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #52525b; font-size: 13px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyLink = `${getAppUrl()}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Verify your InfraNexus email",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fafafa; margin-bottom: 16px;">Verify your email</h2>
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
          Welcome to InfraNexus! Please verify your email address by clicking the button below. This link expires in 24 hours.
        </p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 28px; background: #06b6d4; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #52525b; font-size: 13px; margin-top: 24px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
