"use client";
import { useState, useCallback, useRef } from "react";
import {
  DeployStatus,
  startDeploy,
  getDeployStatus,
  cancelDeploy,
  rollbackDeploy,
} from "@/lib/api";

export function useDeployment(sessionId: string | null) {
  const [status, setStatus] = useState<DeployStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (deployId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const s = await getDeployStatus(deployId);
          setStatus(s);
          // Stop polling on terminal states
          if (
            s.state === "completed" ||
            s.state === "failed"
          ) {
            stopPolling();
            setLoading(false);
          }
        } catch {
          stopPolling();
          setLoading(false);
        }
      }, 1000);
    },
    [stopPolling]
  );

  const deploy = useCallback(
    async (files: Array<{ path: string; content: string }> = []) => {
      if (!sessionId) return;
      setLoading(true);
      setError(null);

      try {
        const initialStatus = await startDeploy(sessionId, files);
        setStatus(initialStatus);

        if (initialStatus.deployId) {
          startPolling(initialStatus.deployId);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    },
    [sessionId, startPolling]
  );

  const cancel = useCallback(async () => {
    if (!status?.deployId) return;
    try {
      await cancelDeploy(status.deployId);
      stopPolling();
      setLoading(false);
      // Refresh status
      const s = await getDeployStatus(status.deployId);
      setStatus(s);
    } catch (err: any) {
      setError(err.message);
    }
  }, [status, stopPolling]);

  const rollback = useCallback(async () => {
    if (!status?.deployId) return;
    setLoading(true);
    try {
      await rollbackDeploy(status.deployId);
      // Refresh status
      const s = await getDeployStatus(status.deployId);
      setStatus(s);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [status]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus(null);
    setLoading(false);
    setError(null);
  }, [stopPolling]);

  return {
    status,
    loading,
    error,
    deploy,
    cancel,
    rollback,
    reset,
  };
}
