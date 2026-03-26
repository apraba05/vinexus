"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { electronSsh } from "@/lib/electron";

interface DiskMount {
  mount: string;
  size: string;
  used: string;
  usePercent: number;
}

interface Metrics {
  cpuPercent: number | null;
  ramUsedMb: number | null;
  ramTotalMb: number | null;
  disks: DiskMount[];
  uptime: string | null;
}

interface Props {
  sessionId: string | null;
}

const POLL_INTERVAL = 10_000;

// Single combined command — one SSH round trip per poll cycle
const METRICS_CMD = [
  "printf '__CPU__\\n'",
  "top -bn1 2>/dev/null | grep -i '%cpu\\|cpu(s)' | head -1",
  "printf '\\n__MEM__\\n'",
  "free -m 2>/dev/null | grep '^Mem:'",
  "printf '\\n__DISK__\\n'",
  "df -h 2>/dev/null",
  "printf '\\n__UPTIME__\\n'",
  "uptime 2>/dev/null",
].join("; ");

function parseCpu(line: string): number | null {
  // Match "id" value: "96.0 id" or "96.0%id"
  const m = line.match(/(\d+\.?\d*)\s*%?\s*id/i);
  if (!m) return null;
  const idle = parseFloat(m[1]);
  return Math.max(0, Math.min(100, 100 - idle));
}

function parseRam(line: string): { used: number; total: number } | null {
  // "Mem:   15862   1203   12143   317   2516   14041"
  const parts = line.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const total = parseInt(parts[1], 10);
  const used = parseInt(parts[2], 10);
  if (isNaN(total) || isNaN(used)) return null;
  return { total, used };
}

function parseDisks(block: string): DiskMount[] {
  const lines = block.trim().split("\n");
  const mounts: DiskMount[] = [];
  for (const line of lines) {
    // Skip header and virtual filesystems
    if (!line.trim() || line.startsWith("Filesystem") || line.startsWith("tmpfs")
      || line.startsWith("devtmpfs") || line.startsWith("udev")
      || line.startsWith("overlay") || line.startsWith("shm")) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    // df -h columns: Filesystem Size Used Avail Use% Mounted
    const pct = parseInt(parts[4].replace("%", ""), 10);
    if (isNaN(pct)) continue;
    mounts.push({
      mount: parts[5],
      size: parts[1],
      used: parts[2],
      usePercent: pct,
    });
  }
  return mounts;
}

function parseUptime(line: string): string {
  // " 14:32:45 up 3 days, 12:45,  1 user,  load average: 0.08, 0.03, 0.05"
  const m = line.match(/up\s+(.+?),\s+\d+\s+user/i);
  if (m) return `up ${m[1].trim()}`;
  // Fallback: everything after "up" until "user"
  const m2 = line.match(/up\s+(.+)/i);
  return m2 ? `up ${m2[1].replace(/,\s*\d+\s*user.*$/, "").trim()}` : line.trim();
}

function parseMetrics(raw: string): Metrics {
  const sections: Record<string, string> = {};
  let current = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("__CPU__")) { current = "cpu"; continue; }
    if (line.startsWith("__MEM__")) { current = "mem"; continue; }
    if (line.startsWith("__DISK__")) { current = "disk"; continue; }
    if (line.startsWith("__UPTIME__")) { current = "uptime"; continue; }
    if (current) sections[current] = (sections[current] ?? "") + line + "\n";
  }

  const cpuLine = (sections.cpu ?? "").trim();
  const memLine = (sections.mem ?? "").trim();
  const diskBlock = (sections.disk ?? "").trim();
  const uptimeLine = (sections.uptime ?? "").trim();

  const ram = parseRam(memLine);

  return {
    cpuPercent: cpuLine ? parseCpu(cpuLine) : null,
    ramUsedMb: ram?.used ?? null,
    ramTotalMb: ram?.total ?? null,
    disks: diskBlock ? parseDisks(diskBlock) : [],
    uptime: uptimeLine ? parseUptime(uptimeLine) : null,
  };
}

export default function InfraPanel({ sessionId }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [polling, setPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const activeRef = useRef(true);

  const fetchMetrics = useCallback(async (sid: string) => {
    setPolling(true);
    try {
      const result = await electronSsh.exec(sid, METRICS_CMD);
      if (!activeRef.current) return;
      if (result?.error) {
        setPollError(result.error);
        return;
      }
      if (result?.exitCode !== 0 && !result?.stdout) {
        setPollError(result?.stderr || "metrics fetch failed");
        return;
      }
      const parsed = parseMetrics(result?.stdout ?? "");
      setMetrics(parsed);
      setLastUpdated(new Date());
      setPollError(null);
    } catch (e: any) {
      if (activeRef.current) setPollError(e.message);
    } finally {
      if (activeRef.current) setPolling(false);
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    if (!sessionId) {
      setMetrics(null);
      setPollError(null);
      setLastUpdated(null);
      return;
    }

    fetchMetrics(sessionId);
    const id = setInterval(() => fetchMetrics(sessionId), POLL_INTERVAL);
    return () => {
      activeRef.current = false;
      clearInterval(id);
    };
  }, [sessionId, fetchMetrics]);

  if (!sessionId) {
    return (
      <div style={s.emptyWrap}>
        <span style={s.emptyText}>Connect to a VM to view infrastructure metrics</span>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <span className="label-sm">Infrastructure</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {polling && <span style={s.spinnerSm} />}
          {lastUpdated && !polling && (
            <span style={s.lastUpdated}>{lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Error */}
      {pollError && (
        <div style={s.errorBanner}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {pollError}
        </div>
      )}

      {/* Loading skeleton */}
      {!metrics && !pollError && (
        <div style={s.loadingWrap}>
          <span style={s.spinner} />
          <span style={s.loadingText}>Collecting metrics…</span>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={s.cards}>
          {/* CPU */}
          <MetricCard label="CPU Usage">
            <GaugeRow
              value={metrics.cpuPercent}
              label={metrics.cpuPercent !== null ? `${metrics.cpuPercent.toFixed(1)}%` : "—"}
              color={gaugeColor(metrics.cpuPercent)}
            />
          </MetricCard>

          {/* RAM */}
          <MetricCard label="Memory">
            {metrics.ramTotalMb !== null && metrics.ramUsedMb !== null ? (() => {
              const pct = (metrics.ramUsedMb / metrics.ramTotalMb) * 100;
              return (
                <GaugeRow
                  value={pct}
                  label={`${formatMb(metrics.ramUsedMb)} / ${formatMb(metrics.ramTotalMb)} (${pct.toFixed(1)}%)`}
                  color={gaugeColor(pct)}
                />
              );
            })() : <span style={s.metricNA}>—</span>}
          </MetricCard>

          {/* Disk */}
          {metrics.disks.length > 0 && (
            <MetricCard label="Disk">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {metrics.disks.map((d) => (
                  <div key={d.mount}>
                    <div style={s.diskMountRow}>
                      <span style={s.diskMount}>{d.mount}</span>
                      <span style={s.diskStats}>{d.used} / {d.size} ({d.usePercent}%)</span>
                    </div>
                    <ProgressBar value={d.usePercent} color={gaugeColor(d.usePercent)} />
                  </div>
                ))}
              </div>
            </MetricCard>
          )}

          {/* Uptime */}
          {metrics.uptime && (
            <MetricCard label="Uptime">
              <span style={s.uptimeText}>{metrics.uptime}</span>
            </MetricCard>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.card}>
      <div style={s.cardLabel}>{label}</div>
      {children}
    </div>
  );
}

function GaugeRow({ value, label, color }: { value: number | null; label: string; color: string }) {
  return (
    <div>
      <div style={s.gaugeLabel}>{label}</div>
      <ProgressBar value={value ?? 0} color={color} />
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={s.barTrack}>
      <div style={{ ...s.barFill, width: `${pct}%`, background: color }} />
    </div>
  );
}

function gaugeColor(pct: number | null): string {
  if (pct === null) return "var(--text-muted)";
  if (pct >= 90) return "var(--danger)";
  if (pct >= 70) return "var(--warning, #f0c040)";
  return "var(--success)";
}

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px 7px",
    flexShrink: 0,
  },
  lastUpdated: {
    fontSize: 9,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  spinnerSm: {
    display: "inline-block",
    width: 8,
    height: 8,
    border: "1.5px solid var(--text-muted)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flex: 1,
    padding: 24,
  },
  loadingText: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "rgba(248,81,73,0.07)",
    color: "var(--danger)",
    fontSize: 10,
    borderBottom: "1px solid rgba(248,81,73,0.15)",
    fontFamily: "var(--font-mono)",
    flexShrink: 0,
  },
  emptyWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 24,
  },
  emptyText: {
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
  },
  cards: {
    overflowY: "auto",
    flex: 1,
    padding: "8px 0",
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  card: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "var(--text-muted)",
    marginBottom: 7,
    fontFamily: "var(--font-sans)",
  },
  gaugeLabel: {
    fontSize: 11,
    color: "var(--text-secondary)",
    marginBottom: 5,
    fontFamily: "var(--font-mono)",
  },
  barTrack: {
    height: 5,
    borderRadius: 3,
    background: "var(--bg-tertiary)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.4s ease, background 0.4s ease",
  },
  diskMountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
    gap: 6,
  },
  diskMount: {
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  diskStats: {
    fontSize: 10,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    flexShrink: 0,
  },
  uptimeText: {
    fontSize: 12,
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
  },
  metricNA: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
};
