"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  sessionId: string | null;
  plan?: string;
  userId?: string;
  onError: (msg: string) => void;
}

export default function AIChatPanel({ sessionId, plan = "free", userId = "anonymous", onError }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPaidPlan = plan !== "free";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isPaidPlan) return;
    fetch(`/api/ai/usage?userId=${encodeURIComponent(userId)}&plan=${plan}`)
      .then(r => r.json())
      .then(d => setUsage({ used: d.used, limit: d.limit }))
      .catch(() => {});
  }, [userId, plan, isPaidPlan]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!isPaidPlan) {
      onError("AI chat requires Premium or above. Upgrade at vinexus.dev/pricing");
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          plan,
          userId,
          systemPrompt: sessionId
            ? "You are a helpful DevOps and software engineering assistant inside the Vinexus IDE. The user is connected to a remote VM via SSH. Be concise and practical. When showing commands, use bash code blocks."
            : "You are a helpful coding assistant inside the Vinexus IDE. Be concise and practical.",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        onError(data.error ?? "AI request failed");
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (data.used !== undefined) setUsage({ used: data.used, limit: data.limit });
    } catch (err: any) {
      onError(err.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, loading, messages, plan, userId, sessionId, isPaidPlan, onError]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!isPaidPlan) {
    return (
      <div style={S.locked}>
        <div style={S.lockedIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={S.lockedTitle}>AI Chat — Premium Feature</div>
        <div style={S.lockedDesc}>
          Upgrade to Premium or Max to access the AI assistant.<br/>
          Ask questions, debug code, and get instant help from Claude.
        </div>
        <a href="http://localhost:3000/pricing" target="_blank" rel="noreferrer" style={S.upgradeBtn}>
          View Plans
        </a>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Usage bar */}
      {usage && (
        <div style={S.usageBar}>
          <span style={S.usageText}>
            {usage.used}/{usage.limit === Infinity ? "∞" : usage.limit} AI requests today
          </span>
          {usage.limit < Infinity && (
            <div style={S.usageTrack}>
              <div style={{ ...S.usageFill, width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`, background: usage.used / usage.limit > 0.8 ? "#ef4444" : "#0053db" }} />
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={S.messages}>
        {messages.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text-bright)" }}>AI Assistant</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Ask me anything — debug code, explain files,<br />write scripts, or get DevOps help.
            </div>
            <div style={S.suggestions}>
              {[
                "Explain this file",
                "Help me debug a crash",
                "Write a deploy script",
                "What does this error mean?",
              ].map(s => (
                <button key={s} style={S.suggestion} onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? S.userMsg : S.assistantMsg}>
            <div style={m.role === "user" ? S.userLabel : S.assistantLabel}>
              {m.role === "user" ? "You" : "✦ Claude"}
            </div>
            <div style={S.msgContent}>
              <MessageContent content={m.content} />
            </div>
          </div>
        ))}

        {loading && (
          <div style={S.assistantMsg}>
            <div style={S.assistantLabel}>✦ Claude</div>
            <div style={S.typing}>
              <span style={S.dot} />
              <span style={{ ...S.dot, animationDelay: "0.15s" }} />
              <span style={{ ...S.dot, animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={S.inputArea}>
        <textarea
          ref={textareaRef}
          style={S.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Claude anything… (Enter to send, Shift+Enter for newline)"
          rows={2}
          disabled={loading}
          spellCheck={false}
        />
        <button
          style={{ ...S.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }}
          onClick={send}
          disabled={loading || !input.trim()}
          title="Send (Enter)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// Render code blocks inside assistant messages
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3).split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(1).join("\n").replace(/```$/, "").trim();
          return (
            <pre key={i} style={S.codeBlock}>
              {lang && <div style={S.codeLang}>{lang}</div>}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{code}</code>
            </pre>
          );
        }
        return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
      })}
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  usageBar: { display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  usageText: { fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" },
  usageTrack: { flex: 1, height: 3, background: "var(--bg-hover)", borderRadius: 2, overflow: "hidden" },
  usageFill: { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  messages: { flex: 1, overflowY: "auto", padding: "12px 0" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 24, textAlign: "center", fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" },
  suggestions: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 16 },
  suggestion: { padding: "5px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" },
  userMsg: { padding: "6px 12px 6px 24px", marginBottom: 8 },
  assistantMsg: { padding: "6px 12px", background: "var(--bg-secondary)", borderLeft: "2px solid var(--accent)", marginBottom: 8 },
  userLabel: { fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3, fontFamily: "var(--font-sans)" },
  assistantLabel: { fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3, fontFamily: "var(--font-sans)" },
  msgContent: { fontSize: 12, color: "var(--text-primary)", lineHeight: 1.65, fontFamily: "var(--font-sans)" },
  codeBlock: { background: "var(--terminal-bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px", margin: "6px 0", overflow: "auto", fontSize: 11, color: "#e6edf3", position: "relative" },
  codeLang: { fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-sans)" },
  typing: { display: "flex", gap: 4, alignItems: "center", padding: "4px 0" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "aiDotPulse 1s ease-in-out infinite" },
  inputArea: { display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid var(--border)", flexShrink: 0, alignItems: "flex-end" },
  textarea: { flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-sans)", resize: "none", outline: "none", lineHeight: 1.5 },
  sendBtn: { width: 32, height: 32, borderRadius: 8, background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  locked: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 24, textAlign: "center", gap: 10 },
  lockedIcon: { width: 48, height: 48, borderRadius: 12, background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" },
  lockedTitle: { fontSize: 14, fontWeight: 600, color: "var(--text-bright)", fontFamily: "var(--font-sans)" },
  lockedDesc: { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-sans)" },
  upgradeBtn: { padding: "8px 20px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-sans)" },
};
