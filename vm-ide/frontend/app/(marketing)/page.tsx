"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const BlurText = dynamic(() => import("@/components/reactbits/BlurText"), { ssr: false });
const GradientText = dynamic(() => import("@/components/reactbits/GradientText"), { ssr: false });
const ShinyText = dynamic(() => import("@/components/reactbits/ShinyText"), { ssr: false });
const CountUp = dynamic(() => import("@/components/reactbits/CountUp"), { ssr: false });
const Squares = dynamic(() => import("@/components/reactbits/Squares"), { ssr: false });

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    ),
    title: "Monaco Editor",
    desc: "Full VS Code editing experience with syntax highlighting, IntelliSense, and multi-file tabs.",
    accent: "#06b6d4",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    title: "Integrated Terminal",
    desc: "xterm.js-powered terminal with direct SSH access to your Linux virtual machines.",
    accent: "#10b981",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "One-Click Deploy",
    desc: "Deploy changes to production with pre-validation, automatic backup, and instant rollback.",
    accent: "#f59e0b",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Server Commands",
    desc: "Run predefined or custom server commands with safety levels and sudo support.",
    accent: "#8b5cf6",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: "AI Insights",
    desc: "AI-powered file analysis, log diagnosis, and config validation via AWS Bedrock.",
    accent: "#ec4899",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "File Management",
    desc: "Browse, create, rename, and delete files and folders with a familiar tree interface.",
    accent: "#06b6d4",
  },
];

const stats = [
  { value: 99.9, suffix: "%", label: "Uptime SLA" },
  { value: 50, suffix: "ms", label: "Avg Latency" },
  { value: 6, suffix: "+", label: "Core Tools" },
  { value: 24, suffix: "/7", label: "Monitoring" },
];

const steps = [
  {
    num: "01",
    title: "Connect your VM",
    desc: "Enter your server credentials. InfraNexus connects via SSH — no agents to install.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Edit & manage",
    desc: "Use the full Monaco editor, terminal, and file tree — just like VS Code, in your browser.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Deploy with confidence",
    desc: "Push changes live with pre-validation, backups, and one-click rollback if anything goes wrong.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
  },
];

function HeroCTA() {
  const { data: session } = useSession();
  const plan = (session as any)?.plan || "free";
  const isPro = plan === "pro";

  if (!session) {
    return (
      <div className="hero-actions">
        <Link href="/signup" className="btn btn-primary btn-lg">
          <span>Get Started Free</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        <Link href="/pricing" className="btn btn-secondary btn-lg">
          View Pricing
        </Link>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="hero-actions">
        <Link href="/dashboard" className="btn btn-primary btn-lg">
          <span>Go to Dashboard</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="hero-actions">
      <Link href="/pricing" className="btn btn-primary btn-lg">
        <span>Upgrade to Pro</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
      <Link href="/dashboard" className="btn btn-secondary btn-lg">
        Dashboard
      </Link>
    </div>
  );
}

function BottomCTA() {
  const { data: session } = useSession();
  const plan = (session as any)?.plan || "free";
  const isPro = plan === "pro";

  if (!session) {
    return (
      <>
        <p className="section-subtitle" style={{ marginBottom: 40 }}>
          Start with the free plan. Upgrade anytime for Pro features.
        </p>
        <Link href="/signup" className="btn btn-primary btn-lg">
          <span>Get Started Free</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </>
    );
  }

  if (isPro) {
    return (
      <>
        <p className="section-subtitle" style={{ marginBottom: 40 }}>
          Jump back into your workspace and keep building.
        </p>
        <Link href="/dashboard" className="btn btn-primary btn-lg">
          <span>Go to Dashboard</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="section-subtitle" style={{ marginBottom: 40 }}>
        Unlock deploy, server commands, and AI insights with Pro.
      </p>
      <Link href="/pricing" className="btn btn-primary btn-lg">
        <span>Upgrade to Pro</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </>
  );
}

export default function LandingPage() {
  return (
    <div style={{ overflow: "hidden" }}>
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg">
          <Squares
            direction="diagonal"
            speed={0.3}
            borderColor="rgba(6, 182, 212, 0.06)"
            squareSize={48}
            hoverFillColor="rgba(6, 182, 212, 0.03)"
          />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <ShinyText
              text="Browser-based IDE for Linux VMs"
              speed={3}
              color="#71717a"
              shineColor="#06b6d4"
            />
          </div>

          <BlurText
            text="Manage your infrastructure from anywhere"
            className="hero-blur-title"
            delay={100}
            animateBy="words"
            direction="bottom"
          />

          <p className="hero-subtitle">
            A full VS Code-like IDE in your browser. Connect to any Linux VM
            over SSH — edit files, run commands, deploy, and monitor with
            AI-powered insights.
          </p>

          <HeroCTA />
        </div>

        {/* IDE Preview Mockup */}
        <div className="hero-preview">
          <div className="ide-mockup">
            <div className="ide-titlebar">
              <div className="ide-dots">
                <span className="ide-dot" style={{ background: "#ef4444" }} />
                <span className="ide-dot" style={{ background: "#f59e0b" }} />
                <span className="ide-dot" style={{ background: "#22c55e" }} />
              </div>
              <span className="ide-titlebar-text">InfraNexus — server01</span>
              <div style={{ width: 52 }} />
            </div>
            <div className="ide-body">
              <div className="ide-sidebar">
                <div className="ide-file active">index.js</div>
                <div className="ide-file">package.json</div>
                <div className="ide-file">config.yml</div>
                <div className="ide-file">.env</div>
              </div>
              <div className="ide-editor">
                <div className="ide-line"><span className="ide-ln">1</span><span className="c-keyword">const</span> express = <span className="c-fn">require</span>(<span className="c-str">&apos;express&apos;</span>);</div>
                <div className="ide-line"><span className="ide-ln">2</span><span className="c-keyword">const</span> app = <span className="c-fn">express</span>();</div>
                <div className="ide-line"><span className="ide-ln">3</span></div>
                <div className="ide-line"><span className="ide-ln">4</span>app.<span className="c-fn">get</span>(<span className="c-str">&apos;/&apos;</span>, (req, res) =&gt; {"{"}</div>
                <div className="ide-line"><span className="ide-ln">5</span>  res.<span className="c-fn">json</span>({"{"} <span className="c-key">status</span>: <span className="c-str">&apos;running&apos;</span> {"}"});</div>
                <div className="ide-line"><span className="ide-ln">6</span>{"}"});</div>
                <div className="ide-line"><span className="ide-ln">7</span></div>
                <div className="ide-line"><span className="ide-ln">8</span>app.<span className="c-fn">listen</span>(<span className="c-num">3000</span>);</div>
              </div>
            </div>
            <div className="ide-terminal">
              <span className="ide-prompt">$</span> node index.js
              <br />
              <span style={{ color: "#22c55e" }}>Server listening on port 3000</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item">
              <div className="stat-value">
                <CountUp to={stat.value} duration={2.5} separator="," />
                <span>{stat.suffix}</span>
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section-container">
        <div className="section-header">
          <GradientText
            colors={["#06b6d4", "#22d3ee", "#67e8f9", "#06b6d4"]}
            animationSpeed={6}
          >
            <h2 className="section-title">Everything you need</h2>
          </GradientText>
          <p className="section-subtitle">
            A complete toolkit for managing your Linux virtual machines — no
            desktop app required.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ "--accent": f.accent } as React.CSSProperties}>
              <div className="feature-icon" style={{
                background: `linear-gradient(135deg, ${f.accent}15, ${f.accent}08)`,
                color: f.accent,
              }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section-container">
        <div className="section-header">
          <GradientText
            colors={["#06b6d4", "#a78bfa", "#06b6d4"]}
            animationSpeed={5}
          >
            <h2 className="section-title">How it works</h2>
          </GradientText>
          <p className="section-subtitle">
            Get from zero to managing your servers in under two minutes.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-num">{step.num}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {i < steps.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="hero-bg" style={{ opacity: 0.4 }}>
          <Squares
            direction="right"
            speed={0.2}
            borderColor="rgba(6, 182, 212, 0.05)"
            squareSize={60}
            hoverFillColor="rgba(6, 182, 212, 0.02)"
          />
        </div>
        <div className="cta-content">
          <GradientText
            colors={["#06b6d4", "#22d3ee", "#a78bfa", "#06b6d4"]}
            animationSpeed={5}
          >
            <h2 className="section-title" style={{ fontSize: 36 }}>Ready to streamline your workflow?</h2>
          </GradientText>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
