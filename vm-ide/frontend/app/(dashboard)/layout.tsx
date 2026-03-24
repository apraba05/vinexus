"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/lib/ThemeContext";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  // null = not yet determined (prevents premature redirect before Electron check completes)
  const [isElectron, setIsElectron] = useState<boolean | null>(null);

  useEffect(() => {
    // Run synchronously so isElectron is known before redirect effect fires
    setIsElectron("electronAPI" in window);
  }, []);

  useEffect(() => {
    // Wait until we know whether we're in Electron before redirecting
    if (isElectron === null) return;
    if (!isElectron && status === "unauthenticated") {
      router.push("/login");
    }
  }, [isElectron, status, router]);

  // Not yet determined — show nothing to avoid flash before we know context
  if (isElectron === null) return null;

  // In Electron, always render — AppPage handles its own auth gate
  if (isElectron) return <>{children}</>;

  if (status === "loading") {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1117",
        color: "#8b949e",
        fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </ThemeProvider>
  );
}
