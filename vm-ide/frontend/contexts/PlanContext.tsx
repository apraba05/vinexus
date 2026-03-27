"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface PlanFeatures {
  ide: boolean;
  terminal: boolean;
  files: boolean;
  deploy: boolean;
  commands: boolean;
  ai: boolean;
  agentDev: boolean;
}

interface PlanContextValue {
  plan: string;
  features: PlanFeatures;
  isPro: boolean;
  isLoading: boolean;
}

const defaultFeatures: PlanFeatures = {
  ide: true,
  terminal: true,
  files: true,
  deploy: true,
  commands: false,
  ai: false,
  agentDev: false,
};

const PlanContext = createContext<PlanContextValue>({
  plan: "free",
  features: defaultFeatures,
  isPro: false,
  isLoading: true,
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [desktopPlan, setDesktopPlan] = useState<string | null>(null);
  const [desktopFeatures, setDesktopFeatures] = useState<PlanFeatures | null>(null);
  const [desktopLoaded, setDesktopLoaded] = useState(false);

  useEffect(() => {
    const ea = typeof window !== "undefined" ? (window as any).electronAPI : null;
    if (!ea?.auth?.getSession) {
      setDesktopLoaded(true);
      return;
    }

    let cancelled = false;

    const applyDesktopUser = (user: any) => {
      if (user) {
        setDesktopPlan(typeof user.plan === "string" ? user.plan : "free");
        setDesktopFeatures((user.features as PlanFeatures | undefined) ?? defaultFeatures);
      } else {
        setDesktopPlan(null);
        setDesktopFeatures(null);
      }
    };

    const refreshDesktopPlan = async () => {
      try {
        const synced = await ea.auth.syncPlan?.();
        if (cancelled) return;
        if (synced?.ok && synced.user) {
          applyDesktopUser(synced.user);
          return;
        }

        const res = await ea.auth.getSession();
        if (cancelled) return;
        applyDesktopUser(res?.user);
      } catch {
        // Transient error (e.g. backend not yet ready) — leave desktopPlan
        // unchanged so we don't flash "Upgrade to Pro" for paid users.
        // The window-focus listener will retry automatically.
      } finally {
        if (!cancelled) {
          setDesktopLoaded(true);
        }
      }
    };

    const handleWindowFocus = () => {
      refreshDesktopPlan();
    };

    const stopSessionListener = ea.auth.onSessionChanged?.((user: any) => {
      if (cancelled) return;
      applyDesktopUser(user);
      setDesktopLoaded(true);
    });

    refreshDesktopPlan();
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleWindowFocus);

    return () => {
      cancelled = true;
      stopSessionListener?.();
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleWindowFocus);
    };
  }, []);

  const sessionPlan = (session as any)?.plan as string | undefined;
  const sessionFeatures = (session as any)?.features as PlanFeatures | undefined;

  const plan = desktopPlan || sessionPlan || "free";
  const features: PlanFeatures = desktopFeatures || sessionFeatures || defaultFeatures;
  const isPro = plan !== "free";

  // In Electron, desktopPlan===null after desktopLoaded means the first sync
  // failed (transient). Keep isLoading true so we don't flash "Upgrade to Pro"
  // before the window-focus retry resolves the real plan.
  const isElectronEnv = typeof window !== "undefined" && "electronAPI" in (window as any);
  const isLoading =
    status === "loading" ||
    !desktopLoaded ||
    (isElectronEnv && desktopPlan === null);

  return (
    <PlanContext.Provider value={{ plan, features, isPro, isLoading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
