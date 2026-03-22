"use client";
import React, { useState, useEffect, useCallback } from "react";
import { isElectron } from "@/lib/electron";

interface GitFile {
  status: string; // "M", "A", "D", "?", "R", etc.
  path: string;
}

interface Props {
  sessionId: string | null;
  explorerRoot: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  runInTerminal: (cmd: string) => void;
}

export default function GitPanel({ sessionId, explorerRoot, onError, onSuccess, runInTerminal }: Props) {
  const [branch, setBranch] = useState<string>("");
  const [files, setFiles] = useState<GitFile[]>([]);
  const [commitMsg, setCommitMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

  const exec = useCallback(async (cmd: string): Promise<string> => {
    if (!sessionId) return "";
    const ea = isElectron() ? (window as any).electronAPI : null;
    if (!ea) return "";
    const result = await ea.ssh.exec(sessionId, cmd);
    if (result.error) throw new Error(result.error);
    return result.stdout || "";
  }, [sessionId]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [branchOut, statusOut] = await Promise.all([
        exec(`cd '${explorerRoot}' && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "not a git repo"`),
        exec(`cd '${explorerRoot}' && git status --porcelain 2>/dev/null`),
      ]);
      setBranch(branchOut.trim());
      const parsed: GitFile[] = statusOut.trim().split("\n").filter(Boolean).map((line) => ({
        status: line.slice(0, 2).trim(),
        path: line.slice(3).trim(),
      }));
      setFiles(parsed);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, explorerRoot, exec, onError]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    setCommitting(true);
    try {
      await exec(`cd '${explorerRoot}' && git add -A && git commit -m '${commitMsg.replace(/'/g, "'\\''")}'`);
      setCommitMsg("");
      onSuccess("Committed successfully");
      refresh();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "M" || s.includes("M")) return "#f59e0b";
    if (s === "A" || s.includes("A")) return "#22c55e";
    if (s === "D" || s.includes("D")) return "#ef4444";
    if (s === "?" || s === "??") return "var(--text-muted)";
    return "var(--text-secondary)";
  };

  const statusLabel = (s: string) => {
    if (s.includes("M")) return "M";
    if (s.includes("A")) return "A";
    if (s.includes("D")) return "D";
    if (s === "??" || s === "?") return "U";
    if (s.includes("R")) return "R";
    return s.trim()[0] || "?";
  };

  if (!sessionId) {
    return <div style={styles.empty}>Connect to a VM to use Source Control</div>;
  }

  const isGitRepo = branch && branch !== "not a git repo";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span className="label-sm">Source Control</span>
        <button style={styles.iconBtn} onClick={refresh} title="Refresh" disabled={loading}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      {!isGitRepo ? (
        <div style={styles.empty}>
          <div style={{ marginBottom: 10 }}>Not a git repository</div>
          <button style={styles.actionBtn} onClick={() => runInTerminal(`cd '${explorerRoot}' && git init`)}>
            Initialize Repository
          </button>
        </div>
      ) : (
        <>
          {/* Branch indicator */}
          <div style={styles.branch}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M18 9a9 9 0 0 1-9 9"/>
            </svg>
            <span style={styles.branchName}>{branch}</span>
            <div style={styles.branchActions}>
              <button style={styles.miniBtn} onClick={() => runInTerminal(`cd '${explorerRoot}' && git pull`)} title="Pull">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                </svg>
                Pull
              </button>
              <button style={styles.miniBtn} onClick={() => runInTerminal(`cd '${explorerRoot}' && git push`)} title="Push">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 7 12 3 8 7"/><line x1="12" y1="3" x2="12" y2="15"/>
                  <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                </svg>
                Push
              </button>
            </div>
          </div>

          {/* Commit box */}
          <div style={styles.commitBox}>
            <textarea
              style={styles.commitInput}
              placeholder="Commit message…"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              rows={2}
            />
            <button
              style={{ ...styles.commitBtn, opacity: (!commitMsg.trim() || committing) ? 0.5 : 1 }}
              onClick={handleCommit}
              disabled={!commitMsg.trim() || committing}
            >
              {committing ? "Committing…" : "Commit All"}
            </button>
          </div>

          {/* Changed files */}
          {files.length === 0 ? (
            <div style={styles.noChanges}>No changes</div>
          ) : (
            <div style={styles.fileList}>
              <div style={styles.sectionLabel}>Changes ({files.length})</div>
              {files.map((f, i) => (
                <div key={i} style={styles.fileRow}>
                  <span style={{ ...styles.statusBadge, color: statusColor(f.status) }}>
                    {statusLabel(f.status)}
                  </span>
                  <span style={styles.filePath} title={f.path}>{basename(f.path)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function basename(p: string) { return p.split("/").pop() || p; }

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 7px", flexShrink: 0 },
  iconBtn: { width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--text-muted)", borderRadius: 4, cursor: "pointer" },
  branch: { display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--bg-hover)", margin: "0 8px 8px", borderRadius: 6, flexShrink: 0 },
  branchName: { flex: 1, fontSize: 11, color: "var(--text-primary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  branchActions: { display: "flex", gap: 4, flexShrink: 0 },
  miniBtn: { display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, fontSize: 10, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" },
  commitBox: { padding: "0 8px 8px", flexShrink: 0 },
  commitInput: { width: "100%", padding: "6px 8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)", outline: "none", resize: "none" as const, fontFamily: "var(--font-sans)", boxSizing: "border-box" as const, marginBottom: 4 },
  commitBtn: { width: "100%", padding: "6px 0", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" },
  noChanges: { padding: "12px 12px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)" },
  fileList: { flex: 1, overflowY: "auto" as const },
  sectionLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", padding: "4px 12px 2px", fontFamily: "var(--font-sans)" },
  fileRow: { display: "flex", alignItems: "center", gap: 6, padding: "3px 12px" },
  statusBadge: { fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", width: 14, flexShrink: 0 },
  filePath: { fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  actionBtn: { padding: "7px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" },
  empty: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100%", fontSize: 12, color: "var(--text-muted)", padding: 16, textAlign: "center" as const, fontFamily: "var(--font-sans)" },
};
