"use client";
import React, { createContext, useContext } from "react";
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

  const plan = (session as any)?.plan || "free";
  const features: PlanFeatures = (session as any)?.features || defaultFeatures;
  const isPro = plan === "pro";
  const isLoading = status === "loading";

  return (
    <PlanContext.Provider value={{ plan, features, isPro, isLoading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
