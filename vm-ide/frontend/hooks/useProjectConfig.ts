"use client";
import { useState, useCallback, useEffect } from "react";
import { ProjectConfig, getProjectConfig } from "@/lib/api";

export function useProjectConfig(sessionId: string | null) {
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (rootPath?: string) => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const cfg = await getProjectConfig(sessionId, rootPath);
        setConfig(cfg);
      } catch {
        setConfig(null);
      }
      setLoading(false);
    },
    [sessionId]
  );

  useEffect(() => {
    if (sessionId) {
      load();
    } else {
      setConfig(null);
    }
  }, [sessionId, load]);

  return { config, loading, reload: load };
}
