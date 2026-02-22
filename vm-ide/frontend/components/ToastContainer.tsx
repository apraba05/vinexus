"use client";
import React from "react";
import { Toast } from "@/lib/useToast";

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

const icons: Record<string, string> = {
  error: "M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

const colors: Record<string, string> = {
  error: "var(--danger)",
  success: "var(--success)",
  info: "var(--info)",
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            borderLeft: `3px solid ${colors[toast.type] || colors.info}`,
            animation: "slideIn 0.25s ease-out",
          }}
          onClick={() => onRemove(toast.id)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors[toast.type] || colors.info}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d={icons[toast.type] || icons.info} />
          </svg>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 16,
    right: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 9999,
    maxWidth: 400,
  },
  toast: {
    padding: "10px 14px",
    background: "var(--bg-tertiary)",
    borderRadius: 6,
    color: "var(--text-bright)",
    fontSize: 13,
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    cursor: "pointer",
    wordBreak: "break-word",
    display: "flex",
    alignItems: "center",
    gap: 8,
    backdropFilter: "blur(8px)",
  },
};
