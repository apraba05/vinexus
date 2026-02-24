"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import GradientText from "@/components/reactbits/GradientText";

// ─── Section data ──────────────────────────────────────────────
const sections = [
    { id: "getting-started", title: "Getting Started", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "connecting", title: "Connecting Your VM", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14" },
    { id: "editor", title: "Code Editor", icon: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
    { id: "terminal", title: "Terminal", icon: "M4 17l6-6-6-6M12 19h8" },
    { id: "deploy", title: "Deploy & Commands", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6" },
    { id: "ai", title: "AI Insights", icon: "M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.657.894 3.106 2.227 3.89L9 12l3 2 3-2-.727-1.61A4.5 4.5 0 0 0 12 2z" },
    { id: "plans", title: "Plans & Billing", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { id: "security", title: "Security & Privacy", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { id: "faq", title: "FAQ", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" },
] as const;

function DocIcon({ d }: { d: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
        </svg>
    );
}

function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
    const colors = {
        info: { bg: "rgba(59, 130, 246, 0.06)", border: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", label: "ℹ️" },
        warning: { bg: "rgba(234, 179, 8, 0.06)", border: "rgba(234, 179, 8, 0.15)", text: "#eab308", label: "⚠️" },
        tip: { bg: "rgba(34, 197, 94, 0.06)", border: "rgba(34, 197, 94, 0.15)", text: "#22c55e", label: "💡" },
    };
    const c = colors[type];
    return (
        <div style={{
            padding: "14px 18px", background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: "var(--radius-md)", marginBottom: 20,
            display: "flex", gap: 12, alignItems: "flex-start",
        }}>
            <span style={{ fontSize: 16, flexShrink: 0, paddingTop: 1 }}>{c.label}</span>
            <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{children}</span>
        </div>
    );
}

function KeyboardShortcut({ keys }: { keys: string }) {
    return (
        <span style={{ display: "inline-flex", gap: 4 }}>
            {keys.split("+").map((k, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>+</span>}
                    <kbd style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "var(--text-bright)",
                    }}>{k}</kbd>
                </React.Fragment>
            ))}
        </span>
    );
}

// ─── Section Components ──────────────────────────────────────────

function GettingStartedSection() {
    return (<>
        <p style={S.para}>Welcome to InfraNexus — your browser-based IDE for managing virtual machines. No software to install, no setup required. Just sign in and connect.</p>

        <h3 style={S.h3}>1. Create Your Account</h3>
        <p style={S.para}>Click <strong>Get Started</strong> on the homepage or go to the <strong>Sign Up</strong> page. You can create an account with your email or sign in instantly with GitHub.</p>

        <h3 style={S.h3}>2. Open the IDE</h3>
        <p style={S.para}>From your <strong>Dashboard</strong>, click <strong>Open IDE</strong> to launch the editor. This is where you&apos;ll connect to your VM and start working.</p>

        <h3 style={S.h3}>3. Connect Your VM</h3>
        <p style={S.para}>Enter your VM&apos;s IP address, username, and authentication credentials. InfraNexus supports both <strong>password</strong> and <strong>SSH key</strong> authentication. Once connected, your VM&apos;s file system and terminal are instantly accessible in the browser.</p>

        <h3 style={S.h3}>4. Start Working</h3>
        <p style={S.para}>Browse your files, edit code, run commands in the terminal, and manage your server — all from a single browser tab.</p>
    </>);
}

function ConnectingSection() {
    return (<>
        <p style={S.para}>InfraNexus connects to your VM securely via SSH. Here&apos;s how to set it up.</p>

        <h3 style={S.h3}>What You Need</h3>
        <ul style={S.list}>
            <li><strong>IP Address or Hostname</strong> — Your VM&apos;s public IP (e.g., <code>54.210.123.45</code>) or domain name</li>
            <li><strong>Username</strong> — The SSH user on your VM (e.g., <code>ubuntu</code>, <code>root</code>, <code>ec2-user</code>)</li>
            <li><strong>Password or SSH Key</strong> — Your login credentials</li>
        </ul>

        <h3 style={S.h3}>Authentication Methods</h3>
        <p style={S.para}><strong>Password Authentication:</strong> Enter your SSH password directly. Simple and works with most VMs.</p>
        <p style={S.para}><strong>SSH Key Authentication (recommended):</strong> Paste your private key content into the key field. This is more secure and is the standard for cloud VMs (AWS, DigitalOcean, GCP, etc.).</p>

        <Callout type="info">Your SSH credentials are <strong>never stored on our servers</strong>. They are held in memory only during your active session and automatically cleared when you disconnect or your session times out (30 minutes of inactivity).</Callout>

        <h3 style={S.h3}>Troubleshooting Connection Issues</h3>
        <ul style={S.list}>
            <li><strong>Connection refused</strong> — Make sure SSH (port 22) is open in your VM&apos;s firewall or security group</li>
            <li><strong>Authentication failed</strong> — Double-check your username and password/key. For key auth, make sure you&apos;re pasting the full private key including the <code>-----BEGIN</code> and <code>-----END</code> lines</li>
            <li><strong>Timeout</strong> — Verify the IP address is correct and the VM is running</li>
        </ul>
    </>);
}

function EditorSection() {
    return (<>
        <p style={S.para}>InfraNexus features a full Monaco editor (the same engine that powers VS Code) directly in your browser.</p>

        <h3 style={S.h3}>File Tree</h3>
        <p style={S.para}>The left sidebar shows your VM&apos;s file system. Click any file to open it in the editor. You can also:</p>
        <ul style={S.list}>
            <li><strong>Create files and folders</strong> — Right-click in the file tree or use the toolbar buttons</li>
            <li><strong>Rename</strong> — Right-click a file → Rename</li>
            <li><strong>Delete</strong> — Right-click a file → Delete (with confirmation)</li>
            <li><strong>Navigate</strong> — Click folders to expand/collapse them</li>
        </ul>

        <h3 style={S.h3}>Editing</h3>
        <p style={S.para}>Edit files with full syntax highlighting for 50+ languages. Modified files show a dot indicator so you always know what&apos;s unsaved.</p>
        <ul style={S.list}>
            <li><strong>Save</strong> — <KeyboardShortcut keys="Ctrl+S" /> (or <KeyboardShortcut keys="Cmd+S" /> on Mac)</li>
            <li><strong>Find</strong> — <KeyboardShortcut keys="Ctrl+F" /></li>
            <li><strong>Find &amp; Replace</strong> — <KeyboardShortcut keys="Ctrl+H" /></li>
            <li><strong>Command Palette</strong> — <KeyboardShortcut keys="F1" /></li>
        </ul>

        <Callout type="tip">When you save a file, InfraNexus automatically creates a backup of the previous version on your VM. You can restore backups if you need to undo changes.</Callout>

        <h3 style={S.h3}>Diff View</h3>
        <p style={S.para}>Before saving, you can preview exactly what changed with the built-in diff viewer. This shows a side-by-side comparison of the original file on your VM versus your edits.</p>
    </>);
}

function TerminalSection() {
    return (<>
        <p style={S.para}>The integrated terminal gives you full command-line access to your VM, directly in the browser.</p>

        <h3 style={S.h3}>Using the Terminal</h3>
        <p style={S.para}>Click the <strong>Terminal</strong> tab at the bottom of the IDE to open it. You can type any command just as you would in a regular SSH session — install packages, restart services, view logs, and more.</p>

        <h3 style={S.h3}>Features</h3>
        <ul style={S.list}>
            <li><strong>Full terminal emulation</strong> — Colors, cursor movement, tab completion all work</li>
            <li><strong>Copy &amp; paste</strong> — <KeyboardShortcut keys="Ctrl+C" /> / <KeyboardShortcut keys="Ctrl+V" /> (or right-click)</li>
            <li><strong>Resize</strong> — Drag the terminal panel to make it larger or smaller</li>
            <li><strong>Scrollback</strong> — Scroll up to see previous output</li>
        </ul>

        <Callout type="info">The terminal runs on your VM, not on InfraNexus servers. Every command executes directly on your machine.</Callout>
    </>);
}

function DeploySection() {
    return (<>
        <p style={S.para}>Pro plan features that make server management effortless.</p>

        <h3 style={S.h3}>One-Click Deploy</h3>
        <p style={S.para}>Deploy changes to your server with a single click. The deploy pipeline:</p>
        <ol style={S.list}>
            <li>Validates your configuration files for syntax errors</li>
            <li>Creates backups of existing files</li>
            <li>Pushes your changes to the server</li>
            <li>Restarts affected services</li>
        </ol>
        <p style={S.para}>If anything goes wrong, you can <strong>rollback</strong> to the previous state instantly. Progress is shown in real-time so you always know what&apos;s happening.</p>

        <h3 style={S.h3}>Server Commands</h3>
        <p style={S.para}>Pre-built command templates let you manage your server without memorizing complex commands:</p>
        <ul style={S.list}>
            <li><strong>Services</strong> — Start, stop, restart, check status of systemd services</li>
            <li><strong>Nginx</strong> — Test configuration, reload without downtime</li>
            <li><strong>Docker</strong> — List containers, restart containers</li>
            <li><strong>Logs</strong> — Fetch recent logs for any service</li>
        </ul>

        <Callout type="warning">Server commands execute on your VM with the permissions of the connected SSH user. Use caution with destructive operations.</Callout>
    </>);
}

function AISection() {
    return (<>
        <p style={S.para}>AI-powered features help you understand, diagnose, and validate your server configuration. Available on the Pro plan.</p>

        <h3 style={S.h3}>Explain</h3>
        <p style={S.para}>Select any config file and click <strong>Explain</strong> to get a plain-English breakdown of what each section does. Perfect for understanding complex nginx, Docker, or systemd configurations you didn&apos;t write.</p>

        <h3 style={S.h3}>Diagnose</h3>
        <p style={S.para}>When a service fails, click <strong>Diagnose</strong> to analyze error logs and get AI-suggested fixes. The AI reads the actual error output and provides actionable steps to resolve the issue.</p>

        <h3 style={S.h3}>Validate</h3>
        <p style={S.para}>Before deploying, use <strong>Validate</strong> to check your config files for syntax errors, security issues, and best practice violations. The AI highlights problems and explains how to fix them.</p>
    </>);
}

function PlansSection() {
    return (<>
        <h3 style={S.h3}>Free Plan</h3>
        <p style={S.para}>Everything you need to get started:</p>
        <ul style={S.list}>
            <li>✅ Full code editor with syntax highlighting</li>
            <li>✅ Integrated terminal</li>
            <li>✅ File management (create, edit, rename, delete)</li>
            <li>✅ SSH key &amp; password authentication</li>
        </ul>

        <h3 style={S.h3}>Pro Plan — $10/month</h3>
        <p style={S.para}>Unlock the full power of InfraNexus:</p>
        <ul style={S.list}>
            <li>⚡ Everything in Free</li>
            <li>⚡ One-click deploy with rollback</li>
            <li>⚡ Server command templates (systemd, nginx, Docker)</li>
            <li>⚡ AI Insights (explain, diagnose, validate)</li>
            <li>⚡ Priority support</li>
        </ul>

        <h3 style={S.h3}>Managing Your Subscription</h3>
        <p style={S.para}>You can upgrade, downgrade, or cancel your subscription at any time from your <strong>Account</strong> page. Click <strong>Manage Billing</strong> to open the billing portal where you can:</p>
        <ul style={S.list}>
            <li>Update your payment method</li>
            <li>View invoices and payment history</li>
            <li>Cancel your subscription</li>
        </ul>

        <Callout type="info">If you cancel, you keep Pro features until the end of your current billing period. After that, your account automatically switches to the Free plan. No data is lost — you just lose access to Pro features.</Callout>
    </>);
}

function SecuritySection() {
    return (<>
        <p style={S.para}>We take the security of your data and your VM seriously. Here&apos;s how InfraNexus protects you.</p>

        <h3 style={S.h3}>Your VM Credentials</h3>
        <ul style={S.list}>
            <li>Your SSH passwords and private keys are <strong>never saved</strong> anywhere</li>
            <li>Credentials exist <strong>only while you&apos;re actively connected</strong> and are wiped the moment you disconnect</li>
            <li>Sessions automatically expire after <strong>30 minutes of inactivity</strong> — your credentials are cleared even if you forget to disconnect</li>
        </ul>

        <h3 style={S.h3}>Your Data</h3>
        <ul style={S.list}>
            <li>Your files <strong>stay on your VM</strong> — InfraNexus never copies or stores them on our servers</li>
            <li>We <strong>don&apos;t log</strong> your file contents, code, or terminal commands</li>
            <li>When you use AI features, your file is sent for analysis but <strong>nothing is kept</strong> afterward</li>
            <li>The only things we store are your <strong>account details</strong> (email, name) and <strong>subscription status</strong></li>
        </ul>

        <h3 style={S.h3}>Encryption</h3>
        <ul style={S.list}>
            <li>All traffic between your browser and InfraNexus is <strong>fully encrypted</strong></li>
            <li>Connections to your VM use <strong>SSH encryption</strong> — the same security used by professional server administrators worldwide</li>
            <li>Your account password is <strong>securely hashed</strong> — even we can&apos;t see it</li>
        </ul>

        <h3 style={S.h3}>What We Don&apos;t Have Access To</h3>
        <ul style={S.list}>
            <li>Your VM&apos;s files, databases, or application data</li>
            <li>Your SSH password or private key after your session ends</li>
            <li>Commands you run in the terminal</li>
            <li>Anything stored on your virtual machine</li>
        </ul>

        <Callout type="tip">For maximum security, we recommend using <strong>SSH key authentication</strong> instead of passwords when connecting to your VM.</Callout>
    </>);
}

function FAQSection() {
    const faqs = [
        { q: "What is InfraNexus?", a: "InfraNexus is a browser-based IDE for managing remote virtual machines. Connect to any server via SSH and get a full editor, terminal, file manager, deploy tools, and AI-powered assistance — all without installing anything." },
        { q: "Do I need to install anything?", a: "No. InfraNexus runs entirely in your browser. Just sign up, connect your VM, and start working." },
        { q: "What VMs does it work with?", a: "Any server you can SSH into — AWS EC2, DigitalOcean Droplets, Google Cloud VMs, Linode, Vultr, Hetzner, self-hosted servers, Raspberry Pi, and more." },
        { q: "Is my data safe?", a: "Yes. Your files stay on your VM — we never copy or store them. SSH credentials only exist while you're connected and are wiped on disconnect. All traffic is encrypted." },
        { q: "Does InfraNexus store my files?", a: "No. Your files live only on your VM. InfraNexus reads and writes files directly to your server. We never copy or store your data." },
        { q: "What happens if I cancel my Pro subscription?", a: "You keep Pro features until the end of your billing period. After that, you're automatically moved to the Free plan. All your account data stays intact — you just lose access to deploy, server commands, and AI features." },
        { q: "Can I connect to multiple VMs?", a: "You connect to one VM per session. To switch VMs, disconnect from the current one and connect to a new one." },
        { q: "What happens after 30 minutes of inactivity?", a: "Your session automatically expires for security. You'll need to reconnect by entering your credentials again. This prevents unauthorized access if you leave your computer unattended." },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
            overflow: "hidden", background: open ? "rgba(255,255,255,0.02)" : "transparent",
            transition: "all 0.2s ease",
        }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", background: "none", border: "none",
                    color: "var(--text-bright)", fontSize: 14, fontWeight: 500,
                    cursor: "pointer", textAlign: "left",
                }}
            >
                {question}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", flexShrink: 0, marginLeft: 12 }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            {open && (
                <div style={{ padding: "0 18px 14px", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7 }}>
                    {answer}
                </div>
            )}
        </div>
    );
}

// ─── Section renderer map ────────────────────────────────────────
const sectionRenderers: Record<string, () => JSX.Element> = {
    "getting-started": GettingStartedSection,
    connecting: ConnectingSection,
    editor: EditorSection,
    terminal: TerminalSection,
    deploy: DeploySection,
    ai: AISection,
    plans: PlansSection,
    security: SecuritySection,
    faq: FAQSection,
};

// ─── Main Documentation Page ─────────────────────────────────────
export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("getting-started");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                }
            },
            { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
        );

        sections.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Header */}
            <div style={{
                borderBottom: "1px solid var(--border)", padding: "32px 20px",
                background: "linear-gradient(180deg, rgba(6,182,212,0.03) 0%, transparent 100%)",
            }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <Link href="/dashboard" style={{ ...S.backLink }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-bright)", marginTop: 16, marginBottom: 8 }}>
                        <GradientText colors={["#06b6d4", "#22d3ee", "#67e8f9", "#06b6d4"]} animationSpeed={6}>
                            Documentation
                        </GradientText>
                    </h1>
                    <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
                        Learn how to use InfraNexus to manage your virtual machines from the browser.
                    </p>
                </div>
            </div>

            {/* Mobile nav toggle */}
            <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="docs-mobile-toggle"
                style={{
                    display: "none", position: "sticky", top: 0, zIndex: 20,
                    width: "100%", padding: "12px 20px", background: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border)", border: "none",
                    color: "var(--text-primary)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", justifyContent: "space-between", alignItems: "center",
                }}
            >
                <span>📑 {sections.find(s => s.id === activeSection)?.title}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: isMobileNavOpen ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Content */}
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 40, padding: "0 20px 80px" }}>
                {/* Sidebar */}
                <nav className={`docs-sidebar ${isMobileNavOpen ? 'docs-sidebar-open' : ''}`} style={{
                    width: 220, flexShrink: 0, padding: "24px 0",
                    position: "sticky", top: 0, height: "fit-content", maxHeight: "calc(100vh - 40px)",
                    overflowY: "auto",
                }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {sections.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                onClick={() => setIsMobileNavOpen(false)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "8px 14px", borderRadius: "var(--radius-sm)",
                                    fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400,
                                    color: activeSection === s.id ? "var(--accent)" : "var(--text-secondary)",
                                    background: activeSection === s.id ? "var(--accent-surface)" : "transparent",
                                    textDecoration: "none", transition: "all 0.15s ease",
                                    borderLeft: activeSection === s.id ? "2px solid var(--accent)" : "2px solid transparent",
                                }}
                            >
                                <DocIcon d={s.icon} />
                                {s.title}
                            </a>
                        ))}
                    </div>
                </nav>

                {/* Main content */}
                <main style={{ flex: 1, minWidth: 0, padding: "24px 0" }}>
                    {sections.map((s) => {
                        const Renderer = sectionRenderers[s.id];
                        return (
                            <section key={s.id} id={s.id} style={{ marginBottom: 60, scrollMarginTop: 24 }}>
                                <h2 style={{
                                    fontSize: 22, fontWeight: 700, color: "var(--text-bright)",
                                    marginBottom: 20, paddingBottom: 12,
                                    borderBottom: "1px solid var(--border)",
                                    display: "flex", alignItems: "center", gap: 10,
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: "var(--accent-surface)", border: "1px solid rgba(6,182,212,0.12)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "var(--accent)",
                                    }}>
                                        <DocIcon d={s.icon} />
                                    </div>
                                    {s.title}
                                </h2>
                                {Renderer && <Renderer />}
                            </section>
                        );
                    })}
                </main>
            </div>

            {/* Mobile CSS */}
            <style>{`
        @media (max-width: 768px) {
          .docs-mobile-toggle { display: flex !important; }
          .docs-sidebar {
            display: none;
            position: fixed !important;
            top: 50px;
            left: 0;
            right: 0;
            width: 100% !important;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            z-index: 15;
            padding: 12px 20px !important;
            max-height: 60vh !important;
          }
          .docs-sidebar-open { display: block !important; }
        }
      `}</style>
        </div>
    );
}

// ─── Shared styles ───────────────────────────────────────────────
const S = {
    para: {
        fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 16,
    } as React.CSSProperties,
    h3: {
        fontSize: 16, fontWeight: 600, color: "var(--text-bright)", marginTop: 28, marginBottom: 12,
    } as React.CSSProperties,
    list: {
        paddingLeft: 20, marginBottom: 16, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.8,
    } as React.CSSProperties,
    backLink: {
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
        color: "var(--text-secondary)", textDecoration: "none",
    } as React.CSSProperties,
};
