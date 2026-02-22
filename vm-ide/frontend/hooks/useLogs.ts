"use client";
import { useState, useCallback } from "react";
import { LogEntry, fetchDeployLogs } from "@/lib/api";

export function useLogs(sessionId: string | null) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<string | null>(null);

  const fetch = useCallback(
    async (svc: string, lines: number = 50) => {
      if (!sessionId) return;
      setLoading(true);
      setService(svc);
      try {
        const data = await fetchDeployLogs(sessionId, svc, lines);
        setEntries(data.entries);
      } catch {
        setEntries([]);
      }
      setLoading(false);
    },
    [sessionId]
  );

  const clear = useCallback(() => {
    setEntries([]);
    setService(null);
  }, []);

  return {
    entries,
    loading,
    service,
    fetch,
    clear,
  };
}
