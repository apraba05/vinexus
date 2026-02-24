"use client";
import React, { useEffect, useRef } from "react";
import { getTerminalWsUrl } from "@/lib/api";

interface Props {
  sessionId: string | null;
  onError: (msg: string) => void;
  onActivity?: () => void;
  cdPath?: string | null;
  onCwdChange?: (path: string) => void;
}

export default function TerminalPanel({ sessionId, onError, onActivity, cdPath, onCwdChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<any>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!sessionId || !containerRef.current) return;
    if (initialized.current) return;
    initialized.current = true;

    let term: any;
    let fitAddon: any;
    let ws: WebSocket;

    const init = async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        theme: {
          background: "#1e1e1e",
          foreground: "#cccccc",
          cursor: "#ffffff",
        },
      });
      termRef.current = term;

      fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      term.loadAddon(fitAddon);

      term.open(containerRef.current!);

      // Small delay to let DOM settle before fitting
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch {
          // ignore
        }
      }, 100);

      // Connect WebSocket
      const url = getTerminalWsUrl(sessionId);
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        // Send initial size
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (event) => {
        // Check for JSON messages (CWD changes from PROMPT_COMMAND)
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "cwd" && msg.path) {
              onCwdChange?.(msg.path);
              return; // Don't write CWD messages to terminal
            }
          } catch {
            // Not JSON, treat as terminal data
          }
        }
        const data = event.data instanceof ArrayBuffer
          ? new Uint8Array(event.data)
          : event.data;
        term.write(data);
      };

      ws.onerror = () => {
        onError("Terminal WebSocket error");
      };

      ws.onclose = () => {
        term.write("\r\n[Connection closed]\r\n");
      };

      let activityTimer: ReturnType<typeof setTimeout> | null = null;

      term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
        // Detect Enter key — a command was likely submitted
        if (data === "\r" || data === "\n") {
          if (activityTimer) clearTimeout(activityTimer);
          activityTimer = setTimeout(() => {
            onActivity?.();
          }, 1500);
        }
      });

      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });

      // Handle window resize
      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch {
          // ignore
        }
      };
      window.addEventListener("resize", handleResize);

      // Store cleanup ref
      (containerRef.current as any).__cleanup = () => {
        window.removeEventListener("resize", handleResize);
        ws.close();
        term.dispose();
      };
    };

    init();

    return () => {
      initialized.current = false;
      if ((containerRef.current as any)?.__cleanup) {
        (containerRef.current as any).__cleanup();
      }
    };
  }, [sessionId, onError]);

  // Auto cd when explorer path changes
  const prevCdPath = useRef<string | null>(null);
  useEffect(() => {
    if (!cdPath || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    // Send cd if path actually changed
    if (cdPath !== prevCdPath.current) {
      wsRef.current.send(`cd ${cdPath}\r`);
    }
    prevCdPath.current = cdPath;
  }, [cdPath]);

  // Re-fit on visibility
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current.fit();
        } catch {
          // ignore
        }
      }, 50);
    }
  });

  if (!sessionId) {
    return (
      <div style={styles.placeholder}>
        Connect to a VM to open a terminal
      </div>
    );
  }

  return <div ref={containerRef} style={styles.terminal} />;
}

const styles: Record<string, React.CSSProperties> = {
  terminal: {
    width: "100%",
    height: "100%",
    background: "#1e1e1e",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--text-secondary)",
    background: "var(--bg-primary)",
    fontSize: 12,
  },
};
