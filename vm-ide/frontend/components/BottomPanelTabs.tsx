"use client";
import React from "react";

export type BottomTab = "terminal" | "deploy" | "ai";

interface Props {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  hasDeployStatus: boolean;
  deployFailed: boolean;
  agentState: string;
}

export default function BottomPanelTabs({
  activeTab,
  onTabChange,
  hasDeployStatus,
  deployFailed,
  agentState,
}: Props) {
  return (
    <div style={styles.bar}>
      <div style={styles.tabs}>
        <PanelTab
          label="Terminal"
          active={activeTab === "terminal"}
          onClick={() => onTabChange("terminal")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          }
        />
        <PanelTab
          label="AI Developer"
          active={activeTab === "ai"}
          onClick={() => onTabChange("ai")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 5.27 19H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z" />
            </svg>
          }
          indicator={
            agentState === "running" || agentState === "planning"
              ? "#3fffa2"
              : agentState === "awaiting_permission"
                ? "#eab308"
                : undefined
          }
          indicatorPulse={agentState === "running" || agentState === "planning"}
        />
        <PanelTab
          label="Deploy"
          active={activeTab === "deploy"}
          onClick={() => onTabChange("deploy")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
          indicator={
            hasDeployStatus
              ? deployFailed ? "var(--danger)" : "var(--success)"
              : undefined
          }
        />
      </div>
      <div style={styles.rightSlot} />
    </div>
  );
}

function PanelTab({
  label,
  icon,
  active,
  onClick,
  indicator,
  indicatorPulse,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  indicator?: string;
  indicatorPulse?: boolean;
}) {
  return (
    <button
      style={{
        ...styles.tab,
        ...(active ? styles.tabActive : {}),
      }}
      onClick={onClick}
    >
      <span style={{ opacity: active ? 1 : 0.5, display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      <span>{label}</span>
      {indicator && (
        <span
          style={{
            ...styles.indicator,
            background: indicator,
            boxShadow: indicatorPulse ? `0 0 6px ${indicator}` : "none",
            animation: indicatorPulse ? "pulse 1.5s ease-in-out infinite" : "none",
          }}
        />
      )}
      {active && <span style={styles.activeBar} />}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bg-elevated)",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    height: 32,
    padding: "0 4px",
  },
  tabs: {
    display: "flex",
    alignItems: "center",
    height: "100%",
  },
  tab: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "0 12px",
    height: "100%",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "color 0.15s ease",
    whiteSpace: "nowrap" as const,
  },
  tabActive: {
    color: "var(--text-primary)",
  },
  activeBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: "2px 2px 0 0",
    background: "var(--accent)",
    boxShadow: "0 0 8px rgba(63, 255, 162, 0.4)",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  rightSlot: {
    flex: 1,
  },
};
