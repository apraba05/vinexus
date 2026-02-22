"use client";
import { useState, useCallback } from "react";
import {
  CommandTemplate,
  CommandResult,
  getCommandTemplates,
  runCommand,
} from "@/lib/api";

interface CommandExecution {
  templateId: string;
  status: "running" | "success" | "error";
  result?: CommandResult;
  error?: string;
  startedAt: number;
}

export function useCommands(sessionId: string | null) {
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [executions, setExecutions] = useState<CommandExecution[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await getCommandTemplates(sessionId);
      setTemplates(data.templates);
    } catch {
      // Templates will remain empty
    }
  }, [sessionId]);

  const execute = useCallback(
    async (
      templateId: string,
      params: Record<string, string | number> = {}
    ): Promise<CommandResult | null> => {
      if (!sessionId) return null;

      const execution: CommandExecution = {
        templateId,
        status: "running",
        startedAt: Date.now(),
      };

      setExecutions((prev) => [execution, ...prev.slice(0, 19)]); // Keep last 20
      setLoading(true);

      try {
        const result = await runCommand(sessionId, templateId, params);
        const updated: CommandExecution = {
          ...execution,
          status: result.exitCode === 0 ? "success" : "error",
          result,
        };

        setExecutions((prev) =>
          prev.map((e) =>
            e.startedAt === execution.startedAt ? updated : e
          )
        );
        setLoading(false);
        return result;
      } catch (err: any) {
        const updated: CommandExecution = {
          ...execution,
          status: "error",
          error: err.message,
        };
        setExecutions((prev) =>
          prev.map((e) =>
            e.startedAt === execution.startedAt ? updated : e
          )
        );
        setLoading(false);
        return null;
      }
    },
    [sessionId]
  );

  const clearExecutions = useCallback(() => {
    setExecutions([]);
  }, []);

  return {
    templates,
    executions,
    loading,
    fetchTemplates,
    execute,
    clearExecutions,
  };
}
