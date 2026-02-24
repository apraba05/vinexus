"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import GradientText from "@/components/reactbits/GradientText";

// ─── Section data ──────────────────────────────────────────────
const sections = [
    { id: "quickstart", title: "Quickstart", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "onboarding", title: "Onboarding", icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" },
    { id: "workflows", title: "Core Workflows", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6" },
    { id: "integrations", title: "Integrations", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
    { id: "permissions", title: "Permissions & Roles", icon: "M12 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" },
    { id: "troubleshooting", title: "Troubleshooting", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
    { id: "faq", title: "FAQ", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" },
    { id: "security", title: "Security Best Practices", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
] as const;

function DocIcon({ d }: { d: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
        </svg>
    );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
    return (
        <div style={{ marginBottom: 16 }}>
            {title && (
                <div style={{
                    fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    padding: "8px 16px", background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                    border: "1px solid var(--border)", borderBottom: "none",
                }}>
                    {title}
                </div>
            )}
            <pre style={{
                background: "rgba(0,0,0,0.3)", padding: "16px",
                borderRadius: title ? "0 0 var(--radius-md) var(--radius-md)" : "var(--radius-md)",
                border: "1px solid var(--border)", overflowX: "auto",
                fontSize: 13, lineHeight: 1.7, fontFamily: "var(--font-mono)",
                color: "var(--text-primary)", margin: 0,
            }}>
                <code>{children}</code>
            </pre>
        </div>
    );
}

function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
    const colors = {
        info: { bg: "rgba(59, 130, 246, 0.06)", border: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", label: "Info" },
        warning: { bg: "rgba(234, 179, 8, 0.06)", border: "rgba(234, 179, 8, 0.15)", text: "#eab308", label: "Warning" },
        tip: { bg: "rgba(34, 197, 94, 0.06)", border: "rgba(34, 197, 94, 0.15)", text: "#22c55e", label: "Tip" },
    };
    const c = colors[type];
    return (
        <div style={{
            padding: "14px 18px", background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: "var(--radius-md)", marginBottom: 20,
            display: "flex", gap: 12, alignItems: "flex-start",
        }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", paddingTop: 2 }}>
                {c.label}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{children}</span>
        </div>
    );
}

// ─── Section Components ──────────────────────────────────────────

function QuickstartSection() {
    return (<>
        <p style={S.para}>Get InfraNexus running on your machine in under 5 minutes.</p>

        <h3 style={S.h3}>1. Prerequisites</h3>
        <ul style={S.list}>
            <li>Node.js 20+ and npm</li>
            <li>PostgreSQL 16+ (or use Docker Compose)</li>
            <li>A remote VM or server accessible via SSH</li>
        </ul>

        <h3 style={S.h3}>2. Clone & Install</h3>
        <CodeBlock title="Terminal">{`git clone https://github.com/your-org/infranexus.git
cd infranexus

# Install root dependencies (Prisma)
npm install

# Install frontend
cd frontend && npm install && cd ..

# Install backend
cd backend && npm install && cd ..`}</CodeBlock>

        <h3 style={S.h3}>3. Configure Environment</h3>
        <CodeBlock title="Terminal">{`# Copy example env files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Generate a secure NextAuth secret
openssl rand -base64 32
# Paste the output as NEXTAUTH_SECRET in both .env files`}</CodeBlock>
        <Callout type="warning">Never commit real secrets. The <code>.gitignore</code> excludes <code>.env</code> and <code>.env.local</code> by default.</Callout>

        <h3 style={S.h3}>4. Database Setup</h3>
        <CodeBlock title="Terminal">{`# Push the Prisma schema to your database
npm run db:push

# Seed initial data (plans, admin user)
npm run db:seed`}</CodeBlock>

        <h3 style={S.h3}>5. Start Development</h3>
        <CodeBlock title="Terminal">{`# Terminal 1: Start the backend
cd backend && npm run dev

# Terminal 2: Start the frontend
cd frontend && npm run dev`}</CodeBlock>
        <p style={S.para}>Open <strong>http://localhost:3000</strong> in your browser. Sign up, connect to your VM, and you&apos;re ready to go!</p>
    </>);
}

function OnboardingSection() {
    return (<>
        <p style={S.para}>After signing up, here&apos;s how to get productive with InfraNexus quickly.</p>

        <h3 style={S.h3}>Create Your Account</h3>
        <p style={S.para}>Navigate to <strong>/signup</strong> and create an account with your email. You&apos;ll receive a verification email — click the link to activate your account. GitHub OAuth is also available for one-click signup.</p>

        <h3 style={S.h3}>Connect to a VM</h3>
        <ol style={S.list}>
            <li>Click <strong>Open IDE</strong> from the Dashboard</li>
            <li>Fill in your VM&apos;s hostname/IP, username, and select an auth method (password or SSH key)</li>
            <li>Click <strong>Connect</strong> — InfraNexus establishes an SSH session and opens your file tree</li>
        </ol>
        <Callout type="tip">For SSH key auth, paste your private key content directly into the form. Keys are only held in memory during your session and never stored on disk.</Callout>

        <h3 style={S.h3}>Explore the IDE</h3>
        <p style={S.para}>The IDE provides several panels:</p>
        <ul style={S.list}>
            <li><strong>File Tree</strong> (left) — Browse, create, rename, and delete files/folders</li>
            <li><strong>Editor</strong> (center) — Monaco-powered code editor with syntax highlighting</li>
            <li><strong>Terminal</strong> (bottom) — Full terminal access to your VM</li>
            <li><strong>Toolbar</strong> (top) — Save, create new files, deploy, and run server commands</li>
        </ul>
    </>);
}

function WorkflowsSection() {
    return (<>
        <p style={S.para}>InfraNexus supports several core workflows for managing your infrastructure.</p>

        <h3 style={S.h3}>Editing Files</h3>
        <p style={S.para}>Click any file in the tree to open it in the Monaco editor. Changes are tracked with a dot indicator. Press <code>Ctrl+S</code> (or click <strong>Save</strong>) to write changes back to your VM. InfraNexus uses safe-write (temp file + atomic rename) and auto-creates backups of modified files.</p>

        <h3 style={S.h3}>Using the Terminal</h3>
        <p style={S.para}>The integrated terminal connects directly to your VM via SSH. It supports full xterm.js rendering including colors, cursor movement, and tab completion. Use it for running commands, viewing logs, and managing services.</p>

        <h3 style={S.h3}>Server Commands (Pro)</h3>
        <p style={S.para}>Pre-built command templates let you manage systemd services, Docker containers, and nginx — all from a clean UI. Available commands include:</p>
        <ul style={S.list}>
            <li><strong>systemctl</strong> — start, stop, restart, status, daemon-reload</li>
            <li><strong>nginx</strong> — test config, reload</li>
            <li><strong>docker</strong> — list containers, restart</li>
            <li><strong>journalctl</strong> — fetch service logs</li>
        </ul>

        <h3 style={S.h3}>One-Click Deploy (Pro)</h3>
        <p style={S.para}>The deploy pipeline validates your config files, creates backups, pushes changes, and restarts services in a single click. If anything fails, you can rollback to the previous state. Deploy progress is streamed in real-time via WebSocket.</p>

        <h3 style={S.h3}>AI Insights (Pro)</h3>
        <p style={S.para}>Powered by AWS Bedrock (Claude), AI features include:</p>
        <ul style={S.list}>
            <li><strong>Explain</strong> — Get plain-English explanations of config files</li>
            <li><strong>Diagnose</strong> — Analyze service failure logs and suggest fixes</li>
            <li><strong>Validate</strong> — Check config file syntax with AI-powered error explanations</li>
        </ul>
    </>);
}

function IntegrationsSection() {
    return (<>
        <p style={S.para}>InfraNexus integrates with several services to provide a complete infrastructure management experience.</p>

        <h3 style={S.h3}>GitHub OAuth</h3>
        <p style={S.para}>Sign in with GitHub for one-click authentication. Configure <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> in your environment. Create a GitHub OAuth App at <strong>Settings → Developer settings → OAuth Apps</strong> with callback URL set to <code>https://your-domain/api/auth/callback/github</code>.</p>

        <h3 style={S.h3}>Stripe Billing</h3>
        <p style={S.para}>Stripe handles subscription billing for the Pro plan. Required env vars:</p>
        <ul style={S.list}>
            <li><code>STRIPE_SECRET_KEY</code> — Your Stripe secret key</li>
            <li><code>STRIPE_WEBHOOK_SECRET</code> — Webhook signing secret</li>
            <li><code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> — Client-side publishable key</li>
            <li><code>STRIPE_PRO_PRICE_ID</code> — Price ID for the Pro plan</li>
        </ul>
        <Callout type="info">Set up a webhook endpoint in Stripe Dashboard pointing to <code>https://your-domain/api/webhooks/stripe</code> with events: <code>checkout.session.completed</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code>, <code>invoice.payment_failed</code>.</Callout>

        <h3 style={S.h3}>AWS Bedrock (AI)</h3>
        <p style={S.para}>AI features use AWS Bedrock with Claude. Configure <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code>, and <code>AWS_REGION</code> in the backend environment. The IAM user needs <code>bedrock:InvokeModel</code> permission.</p>

        <h3 style={S.h3}>Resend (Email)</h3>
        <p style={S.para}>Email verification and password reset emails are sent via Resend. Set <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> in your frontend environment.</p>

        <h3 style={S.h3}>Caddy (Reverse Proxy)</h3>
        <p style={S.para}>In production, Caddy handles HTTPS with automatic Let&apos;s Encrypt certificates, reverse proxying, and security headers. Configure the <code>DOMAIN</code> env var in <code>docker-compose.prod.yml</code>.</p>
    </>);
}

function PermissionsSection() {
    return (<>
        <p style={S.para}>InfraNexus uses a role-based access control system combined with subscription-based feature gating.</p>

        <h3 style={S.h3}>Roles</h3>
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={S.table}>
                <thead>
                    <tr>
                        <th style={S.th}>Role</th>
                        <th style={S.th}>Description</th>
                        <th style={S.th}>Access</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={S.td}><code>user</code></td><td style={S.td}>Default role for all signups</td><td style={S.td}>Dashboard, IDE, Account</td></tr>
                    <tr><td style={S.td}><code>admin</code></td><td style={S.td}>Administrative access</td><td style={S.td}>All user access + Admin panel</td></tr>
                </tbody>
            </table>
        </div>

        <h3 style={S.h3}>Subscription Plans</h3>
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={S.table}>
                <thead>
                    <tr>
                        <th style={S.th}>Feature</th>
                        <th style={S.th}>Free</th>
                        <th style={S.th}>Pro ($10/mo)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={S.td}>Monaco Editor</td><td style={S.td}>✅</td><td style={S.td}>✅</td></tr>
                    <tr><td style={S.td}>Integrated Terminal</td><td style={S.td}>✅</td><td style={S.td}>✅</td></tr>
                    <tr><td style={S.td}>File Management</td><td style={S.td}>✅</td><td style={S.td}>✅</td></tr>
                    <tr><td style={S.td}>One-Click Deploy</td><td style={S.td}>❌</td><td style={S.td}>✅</td></tr>
                    <tr><td style={S.td}>Server Commands</td><td style={S.td}>❌</td><td style={S.td}>✅</td></tr>
                    <tr><td style={S.td}>AI Insights</td><td style={S.td}>❌</td><td style={S.td}>✅</td></tr>
                </tbody>
            </table>
        </div>

        <h3 style={S.h3}>API Authentication</h3>
        <p style={S.para}>The backend uses two authentication layers:</p>
        <ul style={S.list}>
            <li><strong>NextAuth JWE cookies</strong> — Verified by <code>requireUser</code> middleware for Pro feature access</li>
            <li><strong>Session JWT</strong> — Generated on SSH connect, used for file/terminal/deploy operations</li>
        </ul>
    </>);
}

function TroubleshootingSection() {
    return (<>
        <h3 style={S.h3}>Connection Issues</h3>
        <p style={S.para}><strong>Can&apos;t connect to VM:</strong></p>
        <ul style={S.list}>
            <li>Verify the hostname/IP is correct and reachable (<code>ping your-vm-ip</code>)</li>
            <li>Ensure SSH is running on port 22 (or your custom port)</li>
            <li>Check firewall rules allow inbound SSH from the InfraNexus server</li>
            <li>For key-based auth, ensure the key format is correct (OpenSSH or PEM)</li>
        </ul>

        <h3 style={S.h3}>Build Errors</h3>
        <p style={S.para}><strong>Prisma generate fails:</strong></p>
        <CodeBlock>{`# Ensure the schema is accessible
npx prisma generate --schema=prisma/schema.prisma

# If database URL is wrong
npx prisma db push --accept-data-loss`}</CodeBlock>

        <h3 style={S.h3}>Docker Deployment</h3>
        <p style={S.para}><strong>Container crashes on startup:</strong></p>
        <ul style={S.list}>
            <li>Check logs: <code>docker compose -f docker-compose.prod.yml logs frontend</code></li>
            <li>Ensure <code>DATABASE_URL</code> uses the Docker service name (<code>db</code>) not <code>localhost</code></li>
            <li>Verify all required env vars are set in <code>.env.production</code></li>
        </ul>

        <h3 style={S.h3}>Auth Problems</h3>
        <p style={S.para}><strong>Login fails silently:</strong></p>
        <ul style={S.list}>
            <li>Ensure <code>NEXTAUTH_SECRET</code> matches between frontend and backend</li>
            <li>Check that <code>NEXTAUTH_URL</code> matches your actual deployment URL</li>
            <li>For HTTPS, add <code>AUTH_TRUST_HOST=true</code> to the frontend env</li>
        </ul>

        <h3 style={S.h3}>File Operations</h3>
        <p style={S.para}><strong>Save fails or times out:</strong></p>
        <ul style={S.list}>
            <li>File may exceed the 2MB size limit (configurable via <code>MAX_FILE_SIZE</code>)</li>
            <li>Check disk space on the remote VM</li>
            <li>Verify SFTP permissions for the connected user</li>
        </ul>
    </>);
}

function FAQSection() {
    const faqs = [
        { q: "What is InfraNexus?", a: "InfraNexus is a browser-based IDE for managing remote servers. It provides a Monaco editor, integrated terminal, file management, deploy pipeline, and AI-powered insights — all through your browser." },
        { q: "Is my SSH connection secure?", a: "Yes. SSH connections are established server-side and never exposed to the browser directly. Credentials are held in memory only during the session and cleared on disconnect or timeout (30 minutes default)." },
        { q: "Can I use InfraNexus with any server?", a: "Yes, any server accessible via SSH (Linux, macOS, cloud VMs, etc.) works with InfraNexus. You just need the hostname, username, and either a password or SSH key." },
        { q: "What's the difference between Free and Pro?", a: "Free includes the editor, terminal, and file management. Pro adds one-click deploy, server commands (systemctl, docker, nginx), and AI-powered insights (explain, diagnose, validate)." },
        { q: "How do I deploy to production?", a: "Use the Docker Compose production config: copy .env.production, fill in your secrets, and run `docker compose -f docker-compose.prod.yml up -d`. Caddy handles HTTPS automatically." },
        { q: "Can I self-host InfraNexus?", a: "Absolutely. InfraNexus is designed for self-hosting. The Docker Compose setup includes everything: Caddy, PostgreSQL, Next.js frontend, and Express backend." },
        { q: "How are backups handled?", a: "When you save a file, InfraNexus automatically creates a backup of the previous version on the remote VM. You can list and restore backups from the API." },
        { q: "What AI model is used?", a: "InfraNexus uses AWS Bedrock with Claude (Anthropic) for AI features. You can customize the model ID via the BEDROCK_MODEL_ID environment variable." },
    ];

    return (<>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
        </div>
    </>);
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
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", flexShrink: 0 }}>
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

function SecuritySection() {
    return (<>
        <p style={S.para}>Follow these best practices to keep your InfraNexus deployment secure.</p>

        <h3 style={S.h3}>Environment Variables</h3>
        <ul style={S.list}>
            <li>Generate a strong <code>NEXTAUTH_SECRET</code>: <code>openssl rand -base64 32</code></li>
            <li>Never commit <code>.env</code> files with real secrets — use <code>.env.example</code> templates</li>
            <li>Use a strong PostgreSQL password (20+ chars with mixed case, numbers, symbols)</li>
            <li>Rotate AWS credentials and Stripe keys periodically</li>
        </ul>

        <h3 style={S.h3}>Network Security</h3>
        <ul style={S.list}>
            <li>Deploy behind HTTPS (Caddy handles this automatically with Let&apos;s Encrypt)</li>
            <li>Restrict database access to the Docker network — don&apos;t expose port 5432</li>
            <li>Use a firewall (AWS Security Groups, UFW, etc.) to restrict ports 80, 443, and SSH only</li>
            <li>Consider a WAF (AWS WAF, Cloudflare) for production deployments at scale</li>
        </ul>

        <h3 style={S.h3}>Authentication</h3>
        <ul style={S.list}>
            <li>Enable email verification to prevent spam accounts</li>
            <li>Use strong passwords (8+ chars minimum, enforced by the signup form)</li>
            <li>Prefer SSH key authentication over password when connecting to VMs</li>
            <li>Session timeout is 30 minutes by default — configurable via <code>SESSION_TIMEOUT_MINUTES</code></li>
        </ul>

        <h3 style={S.h3}>Monitoring & Auditing</h3>
        <ul style={S.list}>
            <li>Audit logs are written to <code>logs/audit-YYYY-MM-DD.jsonl</code> — review them regularly</li>
            <li>All API requests are logged with method, path, session ID, IP, status, and duration</li>
            <li>Set up log aggregation (ELK, CloudWatch, Datadog) for production</li>
            <li>Monitor rate limit headers (<code>X-RateLimit-*</code>) for abuse patterns</li>
        </ul>

        <h3 style={S.h3}>Docker Production Hardening</h3>
        <ul style={S.list}>
            <li>Containers run as non-root users (<code>nextjs</code> / <code>backend</code>)</li>
            <li>Resource limits are set in <code>docker-compose.prod.yml</code></li>
            <li>Use <code>docker compose pull</code> regularly to get base image security patches</li>
            <li>Pin base images to specific versions (currently <code>node:20-alpine</code>)</li>
        </ul>

        <Callout type="info">For detailed security architecture and threat model, see the <code>SECURITY.md</code> file in the project root.</Callout>
    </>);
}

// ─── Section renderer map ────────────────────────────────────────
const sectionRenderers: Record<string, () => JSX.Element> = {
    quickstart: QuickstartSection,
    onboarding: OnboardingSection,
    workflows: WorkflowsSection,
    integrations: IntegrationsSection,
    permissions: PermissionsSection,
    troubleshooting: TroubleshootingSection,
    faq: FAQSection,
    security: SecuritySection,
};

// ─── Main Documentation Page ─────────────────────────────────────
export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("quickstart");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Update active section based on scroll position
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
                        Everything you need to get started, configure, and master InfraNexus.
                    </p>
                </div>
            </div>

            {/* Mobile nav toggle */}
            <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                style={{
                    display: "none", position: "sticky", top: 0, zIndex: 20,
                    width: "100%", padding: "12px 20px", background: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border)", border: "none",
                    color: "var(--text-primary)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", justifyContent: "space-between", alignItems: "center",
                    // Shown via CSS media query below
                }}
                className="docs-mobile-toggle"
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
        fontSize: 14,
        color: "var(--text-primary)",
        lineHeight: 1.7,
        marginBottom: 16,
    } as React.CSSProperties,
    h3: {
        fontSize: 16,
        fontWeight: 600,
        color: "var(--text-bright)",
        marginTop: 28,
        marginBottom: 12,
    } as React.CSSProperties,
    list: {
        paddingLeft: 20,
        marginBottom: 16,
        fontSize: 14,
        color: "var(--text-primary)",
        lineHeight: 1.8,
    } as React.CSSProperties,
    backLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        color: "var(--text-secondary)",
        textDecoration: "none",
    } as React.CSSProperties,
    table: {
        width: "100%",
        borderCollapse: "collapse" as const,
        fontSize: 13,
    } as React.CSSProperties,
    th: {
        padding: "10px 14px",
        textAlign: "left" as const,
        borderBottom: "1px solid var(--border)",
        color: "var(--text-secondary)",
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase" as const,
        letterSpacing: "0.04em",
    } as React.CSSProperties,
    td: {
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        color: "var(--text-primary)",
    } as React.CSSProperties,
};
