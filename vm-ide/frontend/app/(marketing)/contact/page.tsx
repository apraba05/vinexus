"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

const GradientText = dynamic(() => import("@/components/reactbits/GradientText"), { ssr: false });

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <GradientText
          colors={["#06b6d4", "#22d3ee", "#67e8f9", "#06b6d4"]}
          animationSpeed={6}
        >
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Contact Us
          </h1>
        </GradientText>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 12 }}>
          Have a question, suggestion, or need help? We&apos;d love to hear from you.
        </p>
      </div>

      {sent ? (
        <div className="auth-card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
            background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
            Message sent!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Thank you for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <div className="auth-card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Subject</label>
              <input
                className="auth-input"
                type="text"
                placeholder="How can we help?"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Message</label>
              <textarea
                className="auth-input"
                placeholder="Tell us more..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                style={{ resize: "vertical", minHeight: 120 }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", padding: "13px 0", marginTop: 4 }} type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 48, textAlign: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-bright)", marginBottom: 16 }}>
          Other ways to reach us
        </h3>
        <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>support@infranexus.com</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Response time</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Within 24 hours</div>
          </div>
        </div>
      </div>
    </div>
  );
}
