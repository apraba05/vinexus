"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Initializes PostHog and tracks page views.
 * Requires NEXT_PUBLIC_POSTHOG_KEY env var.
 * No-ops gracefully if the key is absent.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === "undefined") return;

    import("posthog-js").then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
          capture_pageview: false,
          persistence: "localStorage",
          autocapture: false,
        });
      }
      posthog.capture("$pageview", { path: pathname });
    }).catch(() => {});
  }, [pathname]);

  return <>{children}</>;
}
