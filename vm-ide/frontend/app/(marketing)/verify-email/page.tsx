"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Missing verification token");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Something went wrong");
      });
  }, [token]);

  return (
    <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="auth-card" style={{ textAlign: "center", maxWidth: 420, width: "100%" }}>
        {status === "loading" && (
          <>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", margin: "0 auto 20px",
              border: "3px solid var(--border)", borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
              Verifying your email...
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Please wait a moment
            </p>
          </>
        )}

        {status === "success" && (
          <>
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
              Email verified!
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
              background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
              Verification failed
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              {errorMsg}
            </p>
            <Link href="/login" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>
              Go to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
