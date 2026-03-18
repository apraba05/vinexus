"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { usePlan } from "@/contexts/PlanContext";
import Link from "next/link";
import NavBar from "@/components/NavBar";

/* ─────────────────────────── helpers ─────────────────────────── */
const DOTS = Array.from({ length: 45 }, (_, i) => ({
  left: `${(i * 23 + 7) % 97}%`,
  top: `${(i * 31 + 11) % 93}%`,
  size: i % 5 === 0 ? 3 : 2,
  opacity: 0.04 + (i % 5) * 0.025,
  color: ["#3fffa2", "#4f8ef7", "#a78bfa", "#fca98d", "#ffffff"][i % 5],
}));

type CloudTab = "aws" | "azure" | "gcp";

const CLOUD_STEPS: Record<CloudTab, { title: string; steps: { heading: string; body: string; code?: string; note?: string }[] }> = {
  aws: {
    title: "Amazon Web Services",
    steps: [
      {
        heading: "Open EC2 Security Groups",
        body: "In the AWS Console navigate to EC2 → Network & Security → Security Groups. Select the group attached to your instance.",
      },
      {
        heading: "Add a scoped inbound rule",
        body: "Click Edit inbound rules → Add rule. Set Type: SSH, Port: 22, Source: My IP. This restricts access to only your current IP — never use 0.0.0.0/0 in production.",
        code: "Type: SSH  |  Port: 22  |  Source: <your-ip>/32",
        note: "For teams: use an Elastic IP or a bastion host so the allowed CIDR stays constant.",
      },
      {
        heading: "(Recommended) Use AWS Systems Manager",
        body: "With SSM Session Manager you can connect to your instance with zero open inbound ports. Install the SSM Agent on your instance, attach an IAM role with AmazonSSMManagedInstanceCore, and connect through the console or CLI — no port 22 required.",
        code: "aws ssm start-session --target i-0abc123def456",
      },
    ],
  },
  azure: {
    title: "Microsoft Azure",
    steps: [
      {
        heading: "Open Network Security Groups",
        body: "In the Azure Portal go to your VM → Networking → Inbound port rules. Click Add inbound port rule.",
      },
      {
        heading: "Create a scoped SSH rule",
        body: "Set Source: IP Addresses, Source IP: your office/home CIDR, Destination port: 22, Protocol: TCP, Priority: 300, Action: Allow. Leave the default Deny Any Any rule intact.",
        code: "Source: <your-ip>/32  |  Dest port: 22  |  Priority: 300",
        note: "Lower priority number = higher precedence. Keep the default DenyAllInBound at 65500.",
      },
      {
        heading: "(Recommended) Azure Bastion",
        body: "Azure Bastion provides browser-based SSH/RDP over TLS with no public IP on the VM. Deploy it in the AzureBastionSubnet of your VNet — your VMs never need port 22 exposed to the internet.",
        code: "az network bastion create --name MyBastion --vnet-name MyVNet --resource-group MyRG",
      },
    ],
  },
  gcp: {
    title: "Google Cloud Platform",
    steps: [
      {
        heading: "Open VPC Firewall Rules",
        body: "In Google Cloud Console go to VPC Network → Firewall. Click Create Firewall Rule.",
      },
      {
        heading: "Create a targeted ingress rule",
        body: "Set Direction: Ingress, Targets: Specified target tags, add a tag (e.g. ssh-access), Protocols: TCP, Ports: 22, Source IPv4 ranges: your IP. Apply the tag to your instance.",
        code: "Protocols: tcp  |  Ports: 22  |  Source: <your-ip>/32",
        note: "Tag-based rules only apply to instances carrying that network tag — safer than applying to all instances.",
      },
      {
        heading: "(Recommended) Identity-Aware Proxy (IAP)",
        body: "GCP IAP Tunnel lets you SSH without any open firewall ports. All access is proxied through Google's infrastructure and authenticated against your Google Identity. No public IP required.",
        code: "gcloud compute ssh my-instance --tunnel-through-iap --zone us-central1-a",
      },
    ],
  },
};

const SECURITY_PILLARS = [
  { icon: "🔐", label: "End-to-end encrypted", sub: "SSH tunnel — TLS in transit" },
  { icon: "🗝️", label: "Keys never leave your device", sub: "Private keys stay local" },
  { icon: "🛡️", label: "Zero InfraNexus proxy", sub: "Direct peer-to-peer SSH" },
  { icon: "📋", label: "Full audit trail", sub: "Session logs on your VM" },
];

/* ─────────────────────────── component ─────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession();
  const { plan, features, isPro } = usePlan();
  const emailVerified = (session as any)?.emailVerified;
  const [cloudTab, setCloudTab] = useState<CloudTab>("aws");
  const [copied, setCopied] = useState<string | null>(null);
  const [sshHost, setSshHost] = useState("ec2-54-123-45-67.compute-1.amazonaws.com");
  const [sshUser, setSshUser] = useState("ubuntu");
  const [sshPort, setSshPort] = useState("22");

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const cloud = CLOUD_STEPS[cloudTab];

  return (
    <>
      <NavBar />
      <div style={s.page}>
        {/* Background dots */}
        <div style={s.dots} aria-hidden>
          {DOTS.map((d, i) => (
            <span key={i} style={{ position: "absolute", left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: "50%", background: d.color, opacity: d.opacity, pointerEvents: "none" }} />
          ))}
        </div>

        <div style={s.container}>

          {/* ── Email verify banner ── */}
          {session && !emailVerified && (
            <div style={s.verifyBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 13, color: "#eab308", flex: 1 }}>Please verify your email address. Check your inbox for a verification link.</span>
              <button style={s.resendBtn} onClick={async () => { await fetch("/api/auth/resend-verification", { method: "POST" }); alert("Verification email sent!"); }}>
                Resend
              </button>
            </div>
          )}

          {/* ── Header ── */}
          <div style={s.headerRow}>
            <div>
              <h1 style={s.headline}>Welcome back, {firstName}</h1>
              <p style={s.headlineSub}>Your InfraNexus workspace is ready.</p>
            </div>
            <div style={s.planPill}>
              <span style={s.planDot} />
              {isPro ? "Pro" : "Free"}
            </div>
          </div>

          {/* ════════════════════════════════════════════
              SECTION 1 — DOWNLOAD
          ════════════════════════════════════════════ */}
          <div style={s.downloadCard}>
            <div style={s.downloadGlow} aria-hidden />
            <div style={s.downloadLayout}>

              {/* Left copy */}
              <div style={s.downloadCopy}>
                <div style={s.eyebrow}>InfraNexus Desktop · v2.1.0</div>
                <h2 style={s.downloadH}>Connect to any Linux VM.<br />Code like you're local.</h2>
                <p style={s.downloadP}>
                  A full VS Code–grade IDE that SSH-tunnels directly into your cloud VMs. Monaco Editor, integrated terminal, file tree and one-click deploy — your credentials never touch our servers.
                </p>
                <div style={s.dlBtns}>
                  <a href="#" style={s.dlBtnWhite}>
                    <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-150.3-93.2C-17.1 770.3-41 568 61.2 419.2c41.6-57.7 108.3-97.4 178.7-99.6 65.7-2 126.4 43 166.8 43 39.5 0 112.4-50.3 189.4-50.3 47.4.8 156.8 15.6 228.4 122.6zm-147.2-122.3c30.7-36.2 51.2-86.7 51.2-137.1 0-7.1-.5-14.3-1.7-20.1-48.6 1.8-106.6 33.3-141.5 75.6-27.5 30.7-52.4 80.6-52.4 131.7 0 7.6 1.3 15.3 1.9 17.8 3 .6 7.8 1.3 12.6 1.3 44.1 0 97.6-29.8 129.9-69.2z" /></svg>
                    Download for macOS
                  </a>
                  <a href="#" style={s.dlBtnGhost}>
                    <svg width="14" height="14" viewBox="0 0 88 88" fill="currentColor"><path d="M0 12.4L35.7 7.6l.02 34.43L0 42.1zm35.67 33.47l.03 34.48L.01 75.19V46.08zm4.28-39.2L87.3 0v41.53l-47.35.4zm47.38 41.43L87.3 88 40.0 81.29l-.06-34.5z" /></svg>
                    Download for Windows
                  </a>
                </div>
                <p style={s.dlMeta}>macOS 12+ · Windows 10+ · ARM &amp; x86_64</p>
              </div>

              {/* Right — SSH connection dialog mockup */}
              <div style={s.sshMockupWrap}>
                <div style={s.sshMockup}>
                  {/* IDE title bar */}
                  <div style={s.ideBar}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ ...s.dot, background: "#ff5f57" }} />
                      <span style={{ ...s.dot, background: "#febc2e" }} />
                      <span style={{ ...s.dot, background: "#28c840" }} />
                    </div>
                    <span style={s.ideBarTitle}>InfraNexus — New SSH Connection</span>
                    <span />
                  </div>

                  {/* Split: sidebar + connection panel */}
                  <div style={{ display: "flex", height: 280 }}>
                    {/* Sidebar */}
                    <div style={s.ideSidebar}>
                      <div style={s.sideSection}>CONNECTIONS</div>
                      {["Production DB", "Dev Server", "Staging"].map((n, i) => (
                        <div key={n} style={{ ...s.sideItem, ...(i === 1 ? s.sideItemActive : {}) }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><circle cx="12" cy="12" r="4" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>
                          {n}
                        </div>
                      ))}
                      <div style={{ ...s.sideItem, marginTop: 8 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        <span style={{ color: "#3fffa2" }}>New connection</span>
                      </div>
                    </div>

                    {/* Connection form */}
                    <div style={s.connPanel}>
                      <div style={s.connTitle}>SSH Connection</div>

                      <div style={s.formGrid}>
                        <div style={s.formField}>
                          <label style={s.formLabel}>Hostname / IP</label>
                          <input
                            style={s.formInput}
                            value={sshHost}
                            onChange={e => setSshHost(e.target.value)}
                            placeholder="ec2-xxx.amazonaws.com"
                          />
                        </div>
                        <div style={s.formField}>
                          <label style={s.formLabel}>Port</label>
                          <input
                            style={{ ...s.formInput, width: 70 }}
                            value={sshPort}
                            onChange={e => setSshPort(e.target.value)}
                          />
                        </div>
                        <div style={s.formField}>
                          <label style={s.formLabel}>Username</label>
                          <input
                            style={s.formInput}
                            value={sshUser}
                            onChange={e => setSshUser(e.target.value)}
                            placeholder="ubuntu"
                          />
                        </div>
                        <div style={s.formField}>
                          <label style={s.formLabel}>Auth method</label>
                          <select style={s.formSelect}>
                            <option>SSH Key File (.pem)</option>
                            <option>Password</option>
                            <option>SSH Agent</option>
                          </select>
                        </div>
                        <div style={{ ...s.formField, gridColumn: "1 / -1" }}>
                          <label style={s.formLabel}>Private key path</label>
                          <div style={s.keyPath}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a6490" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                            <span style={{ color: "#4a6490", fontSize: 12, fontFamily: "var(--font-mono)" }}>~/.ssh/my-vm-key.pem</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button style={s.connBtn}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                          Connect
                        </button>
                        <button style={s.testBtn}>Test connection</button>
                      </div>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div style={s.ideStatus}>
                    <span style={{ color: "#3fffa2", fontSize: 10 }}>●</span>
                    <span style={{ color: "#4a6490", fontSize: 10, marginLeft: 5, fontFamily: "var(--font-mono)" }}>SSH tunnel encrypted · keys stored locally · no InfraNexus proxy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              SECURITY ARCHITECTURE STRIP
          ════════════════════════════════════════════ */}
          <div style={s.securityStrip}>
            {SECURITY_PILLARS.map((p) => (
              <div key={p.label} style={s.securityPillar}>
                <span style={s.securityIcon}>{p.icon}</span>
                <div>
                  <div style={s.securityLabel}>{p.label}</div>
                  <div style={s.securitySub}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════════════
              SECTION 2 — CLOUD VM SETUP
          ════════════════════════════════════════════ */}
          <div style={{ marginBottom: 48 }}>
            <div style={s.eyebrow} >CONNECT YOUR VM</div>
            <h3 style={s.sectionH}>Configure secure SSH access on your cloud provider</h3>
            <p style={s.sectionP}>
              InfraNexus connects directly from the IDE to your VM via SSH. Your instance should never be open to the world — follow the steps below to allow only your IP while keeping the rest locked down.
            </p>

            {/* Provider tabs */}
            <div style={s.tabRow}>
              {(["aws", "azure", "gcp"] as CloudTab[]).map((t) => (
                <button
                  key={t}
                  style={{ ...s.tab, ...(cloudTab === t ? s.tabActive : {}) }}
                  onClick={() => setCloudTab(t)}
                >
                  {t === "aws" && <AwsIcon active={cloudTab === t} />}
                  {t === "azure" && <AzureIcon active={cloudTab === t} />}
                  {t === "gcp" && <GcpIcon active={cloudTab === t} />}
                  {cloud.title.split(" ")[0] === t.toUpperCase() ? t.toUpperCase() : { aws: "AWS", azure: "Azure", gcp: "GCP" }[t]}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={s.tabPanel}>
              <div style={s.tabPanelHeader}>
                <div>
                  <div style={s.tabPanelTitle}>{cloud.title}</div>
                  <div style={s.tabPanelSub}>Restrict SSH access to your IP only</div>
                </div>
                <div style={s.securityBadge}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Zero-trust recommended
                </div>
              </div>

              <div style={s.stepsCol}>
                {cloud.steps.map((step, idx) => (
                  <div key={idx} style={s.cloudStep}>
                    <div style={s.cloudStepNum}>{String(idx + 1).padStart(2, "0")}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.cloudStepTitle}>{step.heading}</div>
                      <div style={s.cloudStepBody}>{step.body}</div>
                      {step.code && (
                        <div style={s.codeBlock}>
                          <code style={s.codeText}>{step.code}</code>
                          <button style={s.copyBtn} onClick={() => copy(step.code!, `cloud-${idx}`)}>
                            {copied === `cloud-${idx}` ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8fa3c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                      {step.note && (
                        <div style={s.noteBox}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span style={s.noteText}>{step.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enterprise callout */}
              <div style={s.enterpriseBox}>
                <div>
                  <div style={s.enterpriseTitle}>Enterprise teams</div>
                  <div style={s.enterpriseBody}>
                    For organisations with multiple engineers, deploy a <strong style={{ color: "#c8d8f0" }}>dedicated bastion host</strong> or use your cloud provider's <strong style={{ color: "#c8d8f0" }}>zero-trust tunnel</strong> (AWS SSM · Azure Bastion · GCP IAP). Team members connect through the bastion — your production VMs have no inbound rules at all.
                  </div>
                </div>
                <Link href="/pricing" style={s.enterpriseCta}>
                  Talk to sales
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              SECTION 3 — QUICK ACTIONS
          ════════════════════════════════════════════ */}
          <div style={s.actionsRow}>
            {[
              { href: "/app", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>, iconBg: "rgba(63,255,162,0.07)", iconBorder: "rgba(63,255,162,0.14)", label: "Open Web IDE", sub: "Browser-based fallback" },
              { href: "/account", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, iconBg: "rgba(167,139,250,0.07)", iconBorder: "rgba(167,139,250,0.14)", label: "Account", sub: "Settings & billing" },
              { href: "/docs", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, iconBg: "rgba(79,142,247,0.07)", iconBorder: "rgba(79,142,247,0.14)", label: "Documentation", sub: "Guides & API docs" },
            ].map((a) => (
              <Link key={a.href} href={a.href} style={{ textDecoration: "none", flex: 1 }}>
                <div style={s.actionCard}>
                  <div style={{ ...s.actionIcon, background: a.iconBg, border: `1px solid ${a.iconBorder}` }}>{a.icon}</div>
                  <div>
                    <div style={s.actionLabel}>{a.label}</div>
                    <div style={s.actionSub}>{a.sub}</div>
                  </div>
                  <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2d3f5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* ════════════════════════════════════════════
              SECTION 4 — PLAN
          ════════════════════════════════════════════ */}
          <div style={s.planCard}>
            <div style={s.planCardHeader}>
              <span style={s.planCardTitle}>Your Plan</span>
              <span style={{ ...s.planPill, ...(isPro ? {} : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8fa3c8" }) }}>
                <span style={{ ...s.planDot, ...(isPro ? {} : { background: "#8fa3c8", boxShadow: "none" }) }} />
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
            <div style={s.featGrid}>
              {[
                { name: "Monaco Editor", key: "ide" },
                { name: "Integrated Terminal", key: "terminal" },
                { name: "File Management", key: "files" },
                { name: "One-Click Deploy", key: "deploy" },
                { name: "Server Commands", key: "commands" },
                { name: "Multi-VM connections", key: "deploy" },
              ].map((f) => {
                const on = (features as any)[f.key];
                return (
                  <div key={f.name} style={s.featRow}>
                    {on
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e2d44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    }
                    <span style={{ fontSize: 13, color: on ? "#c8d8f0" : "#1e2d44" }}>{f.name}</span>
                  </div>
                );
              })}
            </div>
            {!isPro && (
              <Link href="/pricing" style={s.upgradeLink}>
                Upgrade to Pro
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

/* ── cloud provider icons ── */
function AwsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 100 100" fill="none" style={{ marginRight: 6 }}>
      <path d="M28.5 45.8c0 1.2.1 2.2.4 2.9.2.7.6 1.5 1 2.3.2.3.2.6.2.8 0 .4-.2.7-.7 1l-2.2 1.5c-.3.2-.6.3-.9.3-.4 0-.7-.2-1-.5-.5-.5-.9-1.1-1.2-1.7-.3-.6-.7-1.3-.9-2.2-2.3 2.7-5.2 4-8.6 4-2.5 0-4.4-.7-5.8-2.1-1.4-1.4-2.1-3.3-2.1-5.5 0-2.4.9-4.4 2.6-5.9 1.7-1.5 4-2.3 6.9-2.3.9 0 1.9.1 3 .2 1 .1 2.1.3 3.2.5v-2c0-2.1-.4-3.5-1.3-4.4-.9-.9-2.4-1.4-4.6-1.4-1 0-2 .1-3 .4-1 .3-2 .6-3 1.1-.4.2-.8.3-1 .3-.5 0-.7-.4-.7-.9v-1.5c0-.5.1-.8.3-1 .2-.2.5-.4 1-.7 1-.5 2.2-1 3.5-1.3 1.3-.3 2.7-.5 4.2-.5 3.2 0 5.6.7 7.1 2.2 1.5 1.5 2.3 3.7 2.3 6.7v8.8zm-11.8 4.4c.9 0 1.8-.2 2.8-.5 1-.3 1.9-.9 2.6-1.8.4-.5.7-1.1.9-1.7.1-.7.2-1.4.2-2.3v-1.1c-.8-.2-1.7-.3-2.6-.4-.9-.1-1.7-.1-2.6-.1-1.8 0-3.2.4-4.1 1.1-.9.7-1.3 1.8-1.3 3.2 0 1.3.3 2.3 1 2.9.6.5 1.6.7 3.1.7zm22.2 3c-.5 0-.9-.1-1.1-.3-.2-.2-.4-.6-.6-1.1L30.3 29c-.2-.6-.3-.9-.3-1.1 0-.4.2-.7.7-.7h2.8c.5 0 .9.1 1.1.3.2.2.4.5.5 1.1l6.4 25.2 5.9-25.2c.1-.6.3-.9.5-1.1.2-.2.6-.3 1.1-.3h2.3c.5 0 .9.1 1.1.3.2.2.4.5.5 1.1l6 25.5 6.6-25.5c.1-.6.3-.9.5-1.1.2-.2.6-.3 1.1-.3h2.7c.5 0 .7.2.7.7 0 .1 0 .3-.1.5L62.5 51.8c-.1.6-.3.9-.5 1.1-.2.2-.6.3-1.1.3h-2.4c-.5 0-.9-.1-1.1-.3-.2-.2-.4-.5-.5-1.1l-5.9-24.7-5.9 24.7c-.1.6-.3.9-.5 1.1-.2.2-.6.3-1.1.3zm44.7.9c-1.5 0-2.9-.2-4.3-.5-1.4-.3-2.5-.7-3.2-1.1-.5-.3-.8-.6-.9-.9-.1-.3-.1-.6-.1-.9v-1.5c0-.5.2-.8.7-.8.2 0 .4 0 .5.1.2.1.4.2.6.3 1 .5 2.1.8 3.2 1.1 1.1.3 2.3.4 3.4.4 1.8 0 3.2-.3 4.2-1 1-.7 1.5-1.6 1.5-2.8 0-.8-.3-1.5-.8-2.1-.5-.6-1.6-1.1-3-1.5l-4.3-1.3c-2.2-.7-3.8-1.7-4.8-3-1-.3-1.5-2.9-1.5-4.6 0-1.3.3-2.5.9-3.5.6-1 1.3-1.9 2.3-2.6 1-.7 2-1.2 3.3-1.6 1.3-.4 2.6-.5 4-.5.7 0 1.4.1 2.1.2.7.1 1.4.2 2 .4.6.2 1.2.4 1.8.6.6.2 1 .5 1.3.7.4.3.7.6.9.9.1.3.2.7.2 1.1v1.4c0 .5-.2.8-.6.8-.2 0-.5-.1-.9-.3-1.4-.7-3-1-4.9-1-1.6 0-2.9.3-3.8.9-.9.6-1.4 1.5-1.4 2.8 0 .8.3 1.6.9 2.1.6.6 1.7 1.1 3.4 1.6l4.2 1.3c2.2.7 3.7 1.6 4.7 2.9 1 1.3 1.5 2.7 1.5 4.3 0 1.4-.3 2.6-.8 3.7-.6 1.1-1.3 2-2.3 2.7-1 .7-2.2 1.3-3.5 1.6-1.4.4-2.8.6-4.4.6z" fill={active ? "#f90" : "#4a6490"} />
    </svg>
  );
}

function AzureIcon({ active }: { active: boolean }) {
  const c = active ? "#0089d6" : "#4a6490";
  return (
    <svg width="14" height="14" viewBox="0 0 96 96" fill="none" style={{ marginRight: 6 }}>
      <path d="M33.5 8h29l-30 76H8L33.5 8z" fill={c} />
      <path d="M62.5 8l-20 46 24 22-36 .5 6-13H62l-20-22 20-33z" fill={c} opacity="0.6" />
    </svg>
  );
}

function GcpIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" style={{ marginRight: 6 }}>
      <path d="M24 9.5c4.6 0 8.7 1.7 11.9 4.4l-4.8 4.8C29.3 16.8 26.8 16 24 16c-5.5 0-10.2 3.7-11.8 8.7H6.2C8 18.3 15.5 9.5 24 9.5z" fill={active ? "#ea4335" : "#4a6490"} />
      <path d="M39.8 24.4c0 .9-.1 1.7-.2 2.6H24v-5.4h9.2c-.4-2.1-1.5-3.9-3.1-5.2l4.8-4.8c3 2.7 4.9 6.6 4.9 12.8z" fill={active ? "#4285f4" : "#4a6490"} />
      <path d="M12.2 28.7C12.7 31.6 14 34.2 15.9 36.1l-4.8 4.8C8 38 6.1 34.1 6.1 29.8l6.1-1.1z" fill={active ? "#fbbc05" : "#4a6490"} />
      <path d="M24 38.5c-2.8 0-5.3-.8-7.4-2.2l-4.8 4.8C15.3 43.5 19.5 45 24 45c8.5 0 15.7-5.1 18.8-12.4H37c-1.8 3.5-5.4 5.9-13 5.9z" fill={active ? "#34a853" : "#4a6490"} />
    </svg>
  );
}

/* ─────────────────────────── styles ─────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: { position: "relative", minHeight: "100vh", background: "#0b1120", padding: "48px 24px 80px", overflow: "hidden" },
  dots: { position: "absolute", inset: 0, pointerEvents: "none" },
  container: { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto" },

  verifyBanner: { padding: "12px 18px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 12, marginBottom: 28, display: "flex", alignItems: "center", gap: 10 },
  resendBtn: { padding: "5px 14px", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, fontSize: 12, color: "#eab308", cursor: "pointer", fontFamily: "var(--font-sans)" },

  headerRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 },
  headline: { fontSize: 28, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", margin: "0 0 4px" },
  headlineSub: { fontSize: 14, color: "#4a6490", margin: 0 },
  planPill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(63,255,162,0.06)", border: "1px solid rgba(63,255,162,0.18)", borderRadius: 9999, fontSize: 12, fontWeight: 600, color: "#3fffa2" },
  planDot: { width: 6, height: 6, borderRadius: "50%", background: "#3fffa2", boxShadow: "0 0 6px rgba(63,255,162,0.8)", display: "inline-block", flexShrink: 0 },

  // Download section
  downloadCard: { position: "relative", background: "#0f1829", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "40px", marginBottom: 20, overflow: "hidden" },
  downloadGlow: { position: "absolute", top: -100, right: -60, width: 500, height: 500, background: "radial-gradient(ellipse, rgba(63,255,162,0.06) 0%, rgba(79,142,247,0.05) 50%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none" },
  downloadLayout: { position: "relative", display: "flex", gap: 48, alignItems: "center" },
  downloadCopy: { flex: "0 0 320px" },
  eyebrow: { fontSize: 11, fontWeight: 700, color: "#3fffa2", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 14 },
  downloadH: { fontSize: 28, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 1.2, margin: "0 0 12px" },
  downloadP: { fontSize: 13, color: "#4a6490", lineHeight: 1.75, marginBottom: 24 },
  dlBtns: { display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 12 },
  dlBtnWhite: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#ffffff", color: "#0b1120", borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none", cursor: "pointer", letterSpacing: "-0.01em", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" },
  dlBtnGhost: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "transparent", color: "#c8d8f0", borderRadius: 9999, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.14)", cursor: "pointer" },
  dlMeta: { fontSize: 11, color: "#2d3f5a", margin: 0 },

  // SSH mockup
  sshMockupWrap: { flex: 1 },
  sshMockup: { background: "#0a0e1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" },
  ideBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#070b17", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  ideBarTitle: { fontSize: 11, color: "#2d3f5a", fontFamily: "var(--font-mono)" },
  ideSidebar: { width: 140, background: "#060a16", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "10px 0", flexShrink: 0, display: "flex", flexDirection: "column" as const },
  sideSection: { fontSize: 9, fontWeight: 700, color: "#2d3f5a", letterSpacing: "0.12em", padding: "0 12px 6px", textTransform: "uppercase" as const },
  sideItem: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, color: "#4a6490", cursor: "pointer", fontFamily: "var(--font-mono)" },
  sideItemActive: { background: "rgba(63,255,162,0.05)", color: "#c8d8f0", borderLeft: "2px solid #3fffa2" },

  // Connection form
  connPanel: { flex: 1, padding: "18px 20px", overflowY: "auto" as const },
  connTitle: { fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 14, letterSpacing: "-0.01em" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 80px", gap: "10px 12px" },
  formField: { display: "flex", flexDirection: "column" as const, gap: 4 },
  formLabel: { fontSize: 10, fontWeight: 600, color: "#4a6490", letterSpacing: "0.05em", textTransform: "uppercase" as const },
  formInput: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 10px", fontSize: 11, color: "#c8d8f0", fontFamily: "var(--font-mono)", outline: "none", width: "100%", boxSizing: "border-box" as const },
  formSelect: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 8px", fontSize: 11, color: "#c8d8f0", outline: "none" },
  keyPath: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 },
  connBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#3fffa2", color: "#0b1120", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" },
  testBtn: { padding: "7px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, fontSize: 12, color: "#8fa3c8", cursor: "pointer", fontFamily: "var(--font-sans)" },
  ideStatus: { padding: "6px 14px", background: "#040810", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center" },

  // Security strip
  securityStrip: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 44, padding: "18px 24px", background: "rgba(63,255,162,0.03)", border: "1px solid rgba(63,255,162,0.08)", borderRadius: 16 },
  securityPillar: { display: "flex", alignItems: "center", gap: 10 },
  securityIcon: { fontSize: 18, flexShrink: 0 },
  securityLabel: { fontSize: 12, fontWeight: 600, color: "#c8d8f0", marginBottom: 2 },
  securitySub: { fontSize: 11, color: "#4a6490" },

  // Cloud setup
  sectionH: { fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", margin: "0 0 8px" },
  sectionP: { fontSize: 14, color: "#4a6490", lineHeight: 1.7, marginBottom: 24, maxWidth: 600 },

  tabRow: { display: "flex", gap: 8, marginBottom: 0 },
  tab: { display: "inline-flex", alignItems: "center", padding: "9px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", borderRadius: "10px 10px 0 0", fontSize: 13, fontWeight: 600, color: "#4a6490", cursor: "pointer", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" },
  tabActive: { background: "#0f1829", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid #0f1829", color: "#ffffff" },
  tabPanel: { background: "#0f1829", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0 12px 12px 12px", padding: "28px 28px" },
  tabPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  tabPanelTitle: { fontSize: 16, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" },
  tabPanelSub: { fontSize: 12, color: "#4a6490", marginTop: 2 },
  securityBadge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(63,255,162,0.05)", border: "1px solid rgba(63,255,162,0.14)", borderRadius: 9999, fontSize: 11, fontWeight: 600, color: "#3fffa2" },

  stepsCol: { display: "flex", flexDirection: "column" as const, gap: 0 },
  cloudStep: { display: "flex", gap: 20, paddingBottom: 24, marginBottom: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  cloudStepNum: { fontSize: 11, fontWeight: 700, color: "#3fffa2", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", flexShrink: 0, width: 28, paddingTop: 2 },
  cloudStepTitle: { fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 6 },
  cloudStepBody: { fontSize: 13, color: "#4a6490", lineHeight: 1.7, marginBottom: 10 },

  codeBlock: { position: "relative", background: "#060b14", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "9px 40px 9px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  codeText: { fontFamily: "var(--font-mono)", fontSize: 12, color: "#c8d8f0", flex: 1 },
  copyBtn: { position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" },

  noteBox: { display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 12px", background: "rgba(79,142,247,0.05)", border: "1px solid rgba(79,142,247,0.12)", borderRadius: 8, marginTop: 4 },
  noteText: { fontSize: 12, color: "#6b8fc8", lineHeight: 1.6 },

  enterpriseBox: { marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "18px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 },
  enterpriseTitle: { fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 4 },
  enterpriseBody: { fontSize: 12, color: "#4a6490", lineHeight: 1.65, maxWidth: 560 },
  enterpriseCta: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "transparent", border: "1px solid rgba(63,255,162,0.22)", borderRadius: 9999, fontSize: 12, fontWeight: 600, color: "#3fffa2", textDecoration: "none", cursor: "pointer", flexShrink: 0 },

  // Quick actions
  actionsRow: { display: "flex", gap: 14, marginBottom: 24 },
  actionCard: { background: "#0f1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" },
  actionIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  actionLabel: { fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 2 },
  actionSub: { fontSize: 11, color: "#4a6490" },

  // Plan card
  planCard: { background: "#0f1829", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px 28px" },
  planCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  planCardTitle: { fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" },
  featGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 0", marginBottom: 18 },
  featRow: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0" },
  upgradeLink: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "rgba(63,255,162,0.07)", border: "1px solid rgba(63,255,162,0.18)", borderRadius: 9999, fontSize: 13, fontWeight: 600, color: "#3fffa2", textDecoration: "none" },
};
