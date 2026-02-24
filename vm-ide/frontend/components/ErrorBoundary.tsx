"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[ErrorBoundary] ${this.props.fallbackLabel || "Component"} crashed:`,
      error,
      info.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--danger)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.6 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={styles.label}>
              {this.props.fallbackLabel || "Component"} encountered an error
            </div>
            <div style={styles.error}>{this.state.error?.message}</div>
            <button
              style={styles.retryBtn}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    background: "var(--bg-primary)",
    padding: 16,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    maxWidth: 300,
    textAlign: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  error: {
    fontSize: 11,
    color: "var(--danger)",
    fontFamily: "monospace",
    padding: "6px 10px",
    background: "rgba(255, 107, 107, 0.08)",
    borderRadius: 4,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  retryBtn: {
    marginTop: 4,
    padding: "5px 14px",
    background: "rgba(6, 182, 212, 0.1)",
    color: "var(--accent)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
  },
};
