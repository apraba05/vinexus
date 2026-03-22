"use client";
import React, { useState, useCallback, useRef } from "react";
import { isElectron, electronSsh } from "@/lib/electron";

interface SearchResult {
  file: string;
  line: number;
  text: string;
}

interface Props {
  sessionId: string | null;
  explorerRoot: string;
  onSelectFile: (path: string) => void;
  onError: (msg: string) => void;
}

export default function SearchPanel({ sessionId, explorerRoot, onSelectFile, onError }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef(false);

  const runSearch = useCallback(async () => {
    if (!sessionId || !query.trim()) return;
    setSearching(true);
    setResults([]);
    setSearched(false);
    abortRef.current = false;

    try {
      const ea = isElectron() ? (window as any).electronAPI : null;
      if (!ea) return;

      const escaped = query.replace(/'/g, "'\\''");
      // Search all non-binary files, skip .git and node_modules
      const cmd = `grep -rn --binary-files=without-match --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.next -e '${escaped}' '${explorerRoot}' 2>/dev/null | head -300`;

      const result = await ea.ssh.exec(sessionId, cmd);
      if (abortRef.current) return;

      if (result.error) { onError(`Search error: ${result.error}`); return; }

      const lines = (result.stdout || "").split("\n").filter(Boolean);
      const parsed: SearchResult[] = [];
      for (const line of lines) {
        const m = line.match(/^(.+?):(\d+):(.*)$/);
        if (m) parsed.push({ file: m[1], line: parseInt(m[2], 10), text: m[3].trim() });
      }
      setResults(parsed);
      setSearched(true);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setSearching(false);
    }
  }, [sessionId, query, explorerRoot, onError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") runSearch();
  };

  if (!sessionId) {
    return (
      <div style={styles.empty}>Connect to a VM to search files</div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span className="label-sm">Search</span>
      </div>
      <div style={styles.inputWrap}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.4 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={styles.input}
          placeholder="Search files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoFocus
        />
        {searching && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.5, animation: "spin 0.8s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )}
      </div>
      <div style={styles.hint}>in {explorerRoot}</div>

      {searched && results.length === 0 && !searching && (
        <div style={styles.noResults}>No results for "{query}"</div>
      )}

      <div style={styles.results}>
        {groupByFile(results).map(({ file, matches }) => (
          <div key={file}>
            <button
              style={styles.fileRow}
              onClick={() => onSelectFile(file)}
              title={file}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={styles.fileName}>{basename(file)}</span>
              <span style={styles.fileMatchCount}>{matches.length}</span>
            </button>
            {matches.map((m, i) => (
              <button
                key={i}
                style={styles.matchRow}
                onClick={() => onSelectFile(file)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={styles.lineNum}>{m.line}</span>
                <span style={styles.matchText}>{highlight(m.text, query)}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function basename(p: string) { return p.split("/").pop() || p; }

function groupByFile(results: SearchResult[]) {
  const map = new Map<string, SearchResult[]>();
  for (const r of results) {
    if (!map.has(r.file)) map.set(r.file, []);
    map.get(r.file)!.push(r);
  }
  return Array.from(map.entries()).map(([file, matches]) => ({ file, matches }));
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(0,83,219,0.2)", color: "inherit", borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  header: { padding: "8px 12px 7px", flexShrink: 0 },
  inputWrap: {
    display: "flex", alignItems: "center", gap: 6,
    margin: "0 8px 4px", padding: "5px 8px",
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: 6, flexShrink: 0,
  },
  input: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-sans)",
  },
  hint: { fontSize: 10, color: "var(--text-muted)", padding: "0 12px 6px", fontFamily: "var(--font-mono)", flexShrink: 0 },
  noResults: { padding: "16px 12px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)" },
  results: { flex: 1, overflowY: "auto" as const },
  empty: { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 12, color: "var(--text-muted)", padding: 16, textAlign: "center" as const, fontFamily: "var(--font-sans)" },
  fileRow: {
    display: "flex", alignItems: "center", gap: 5, width: "100%",
    padding: "5px 10px 3px", background: "transparent", border: "none",
    cursor: "pointer", textAlign: "left" as const,
  },
  fileName: { flex: 1, fontSize: 11, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  fileMatchCount: { fontSize: 10, color: "var(--text-muted)", background: "var(--bg-hover)", borderRadius: 8, padding: "1px 5px", flexShrink: 0, fontFamily: "var(--font-sans)" },
  matchRow: {
    display: "flex", alignItems: "baseline", gap: 8, width: "100%",
    padding: "2px 10px 2px 24px", background: "transparent", border: "none",
    cursor: "pointer", textAlign: "left" as const, transition: "background 0.1s",
  },
  lineNum: { fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, minWidth: 24, textAlign: "right" as const },
  matchText: { fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
};
