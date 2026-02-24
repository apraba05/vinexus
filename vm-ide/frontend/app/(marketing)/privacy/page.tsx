import React from "react";

const sections = [
  {
    title: "Introduction",
    content: `InfraNexus ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our browser-based IDE platform and related services.`,
  },
  {
    title: "Information We Collect",
    content: `We collect information you provide directly, including: your name, email address, and password when you create an account; payment information processed through Stripe; server connection details (SSH credentials) you provide to connect to your virtual machines; and files and data you access or modify through our platform.

We also automatically collect: device and browser information, IP addresses, usage patterns and feature interactions, and log data for debugging and security purposes.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use your information to: provide and maintain our IDE platform; process transactions and manage your subscription; send transactional emails (account verification, password resets); improve our services and develop new features; detect and prevent fraud and abuse; and comply with legal obligations.`,
  },
  {
    title: "Data Storage & Security",
    content: `Your data is stored securely using industry-standard encryption. SSH credentials are encrypted at rest and in transit. We do not store the contents of your server files — all file operations are performed in real-time over your SSH connection. Account data and subscription information are stored in encrypted databases.`,
  },
  {
    title: "Third-Party Services",
    content: `We use the following third-party services that may process your data:

• Stripe — for payment processing and subscription management
• Resend — for transactional email delivery
• AWS Bedrock — for AI-powered features (file analysis, log diagnosis)
• Authentication providers (GitHub) — for OAuth sign-in

Each third-party service has its own privacy policy governing their use of your data.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data; export your account data; opt out of non-essential communications; and withdraw consent for data processing where applicable.

To exercise these rights, contact us at the email below.`,
  },
  {
    title: "Data Retention",
    content: `We retain your account data for as long as your account is active. Upon account deletion, we remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention). Payment records may be retained as required by financial regulations.`,
  },
  {
    title: "Cookies",
    content: `We use essential cookies for authentication and session management. These cookies are strictly necessary for the platform to function and cannot be disabled. We do not use advertising or tracking cookies.`,
  },
  {
    title: "Children's Privacy",
    content: `InfraNexus is not intended for use by individuals under 16 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us so we can take appropriate action.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last Updated" date. Your continued use of the platform after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: "Contact Us",
    content: `If you have questions about this Privacy Policy or our data practices, please contact us at privacy@infranexus.com or through our Contact page.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-bright)", letterSpacing: "-0.03em", marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 48 }}>
        Last updated: February 2026
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {sections.map((s, i) => (
          <div key={i}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-bright)", marginBottom: 12 }}>
              {s.title}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}>
              {s.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
