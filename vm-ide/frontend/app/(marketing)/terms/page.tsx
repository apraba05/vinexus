import React from "react";

const sections = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using InfraNexus ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms constitute a legally binding agreement between you and InfraNexus.`,
  },
  {
    title: "Description of Service",
    content: `InfraNexus is a browser-based IDE platform that allows users to connect to and manage Linux virtual machines via SSH. The Service includes features such as a Monaco code editor, integrated terminal, file management, deployment tools, server commands, and AI-powered insights.`,
  },
  {
    title: "Account Registration",
    content: `To use the Service, you must create an account with a valid email address and password, or sign in using a supported OAuth provider. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.`,
  },
  {
    title: "Acceptable Use",
    content: `You agree not to: use the Service for any unlawful purpose; attempt to gain unauthorized access to any systems or networks; interfere with or disrupt the Service or its infrastructure; transmit malware, viruses, or harmful code through the platform; use the Service to attack, compromise, or damage third-party systems; share your account credentials with others; or resell or redistribute access to the Service without authorization.`,
  },
  {
    title: "Subscription Plans",
    content: `InfraNexus offers a Free plan and a Pro plan ($10/month). The Free plan includes access to the Monaco editor, integrated terminal, and file management. The Pro plan additionally includes one-click deploy, server commands, and AI-powered insights.

Subscriptions are billed monthly through Stripe. You may cancel your subscription at any time, and access will continue until the end of the current billing period. Refunds are not provided for partial billing periods.`,
  },
  {
    title: "Data & Privacy",
    content: `Your use of the Service is also governed by our Privacy Policy. You retain ownership of all data and files on your servers. InfraNexus does not store your server files — all file operations occur in real-time over SSH. You are responsible for the security and backup of your server data.`,
  },
  {
    title: "Intellectual Property",
    content: `The Service, including its design, code, and branding, is the intellectual property of InfraNexus. You retain all rights to code and content you create or modify using the Service. You may not copy, modify, or distribute the Service's proprietary code without permission.`,
  },
  {
    title: "Service Availability",
    content: `We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify users of planned downtime.`,
  },
  {
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law, InfraNexus shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, profits, or business opportunities, arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.`,
  },
  {
    title: "Indemnification",
    content: `You agree to indemnify and hold harmless InfraNexus and its officers, employees, and agents from any claims, damages, or expenses arising from your use of the Service, your violation of these terms, or your violation of any third-party rights.`,
  },
  {
    title: "Termination",
    content: `We reserve the right to suspend or terminate your account if you violate these terms or engage in behavior that is harmful to other users or the Service. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately, and we will delete your account data in accordance with our Privacy Policy.`,
  },
  {
    title: "Governing Law",
    content: `These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration or in the courts of competent jurisdiction.`,
  },
  {
    title: "Changes to Terms",
    content: `We may update these Terms from time to time. Material changes will be communicated via email or through the Service. Your continued use after changes constitutes acceptance of the revised terms.`,
  },
  {
    title: "Contact",
    content: `For questions about these Terms of Service, please contact us at legal@infranexus.com or through our Contact page.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-bright)", letterSpacing: "-0.03em", marginBottom: 8 }}>
        Terms of Service
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
