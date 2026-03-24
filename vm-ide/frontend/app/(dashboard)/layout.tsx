"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/lib/ThemeContext";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && "electronAPI" in window);
  }, []);

  useEffect(() => {
    // Desktop app manages its own auth — never redirect in Electron
    if (!isElectron && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router, isElectron]);

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
