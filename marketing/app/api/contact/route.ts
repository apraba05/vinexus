import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL || "no-reply@vinexus.space";
  const TO = "support@vinexus.space";
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 20px; color: #0d0d0d;">New contact message</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #6b6b6b; width: 80px;">Name</td><td style="padding: 8px 0; color: #0d0d0d;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b6b6b;">Email</td><td style="padding: 8px 0; color: #0d0d0d;"><a href="mailto:${email}" style="color: #0053db;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b6b6b;">Subject</td><td style="padding: 8px 0; color: #0d0d0d;">${subject}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #f5f5f7; border-radius: 8px; font-size: 14px; color: #0d0d0d; line-height: 1.7; white-space: pre-wrap;">${message}</div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
