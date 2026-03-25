"use client";
import { SessionProvider } from "next-auth/react";
import { PlanProvider } from "@/contexts/PlanContext";
import PostHogProvider from "@/components/PostHogProvider";
import { ThemeProvider } from "@/lib/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <PlanProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </PlanProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
