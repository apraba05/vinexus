"use client";
import { SessionProvider } from "next-auth/react";
import { PlanProvider } from "@/contexts/PlanContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlanProvider>{children}</PlanProvider>
    </SessionProvider>
  );
}
