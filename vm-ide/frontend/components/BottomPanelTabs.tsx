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
      <TabButton
        label="Terminal"
        icon="M4 17l6-6-6-6M12 19h8"
        active={activeTab === "terminal"}
        onClick={() => onTabChange("terminal")}
      />
      <TabButton
        label="AI Developer"
        icon="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27a7 7 0 0 1-5.46 3.95 2 2 0 0 1-3.94-1.95A7 7 0 0 1 4.27 19H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"
        active={activeTab === "ai"}
        onClick={() => onTabChange("ai")}
        indicator={
          agentState === "running" || agentState === "planning"
            ? "#06b6d4" // Cyan for running
            : agentState === "awaiting_permission"
              ? "#f0c040" // Yellow for blocked
              : undefined
        }
      />
      <TabButton
        label="Deploy"
        icon="M22 12h-4l-3 9L9 3l-3 9H2"
        active={activeTab === "deploy"}
        onClick={() => onTabChange("deploy")}
        indicator={
          hasDeployStatus
            ? deployFailed
              ? "var(--danger)"
              : "var(--success)"
            : undefined
        }
      />
    </div>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
  badge,
  indicator,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  indicator?: string;
}) {
  return (
    <button
      style={{
        ...styles.tab,
        ...(active ? styles.tabActive : {}),
      }}
      onClick={onClick}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: active ? 0.9 : 0.5 }}
      >
        <path d={icon} />
      </svg>
      <span>{label}</span>
      {badge && <span style={styles.badge}>{badge}</span>}
      {indicator && (
        <span
          style={{
            ...styles.indicator,
            background: indicator,
          }}
        />
      )}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    background: "var(--bg-secondary)",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    padding: "0 8px",
    flexShrink: 0,
    gap: 0,
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 12px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    transition: "all 0.1s ease",
    position: "relative",
  },
  tabActive: {
    color: "var(--text-primary)",
    borderBottomColor: "var(--accent)",
  },
  badge: {
    padding: "1px 5px",
    background: "rgba(6, 182, 212, 0.2)",
    color: "var(--accent)",
    borderRadius: 8,
    fontSize: 9,
    fontWeight: 700,
    fontFamily: "monospace",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },
};
