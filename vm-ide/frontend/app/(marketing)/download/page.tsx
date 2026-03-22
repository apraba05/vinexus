"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

type Platform = "macos" | "windows" | "linux";

// ── Step component ─────────────────────────────────────────────────
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const { D } = useTheme();
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
      <div style={{
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: 6,
        background: D.primaryContainer,
        color: D.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        marginTop: 1,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: D.onSurface, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: D.onSurfaceVariant, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Code block (always dark) ───────────────────────────────────────
function Code({ children }: { children: string }) {
  const { D } = useTheme();
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative", background: "#0d1117", borderRadius: 6, padding: "12px 14px", marginTop: 8, overflowX: "auto" }}>
      <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#c9d1d9", lineHeight: 1.7 }}>{children}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
        style={{ position: "absolute", top: 8, right: 8, background: "rgba(155,178,229,0.1)", border: `1px solid ${D.outlineVariant}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: copied ? "#3fb950" : "#6e7681", cursor: "pointer" }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

// ── Platform content ───────────────────────────────────────────────
function MacOSContent() {
  const { D } = useTheme();
  const ic: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: D.onSurface,
    background: D.surfaceContainer,
    padding: "2px 6px",
    borderRadius: 3,
  };
  return (
    <div>
      {/* Download button */}
      <div style={{ marginBottom: 32 }}>
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 24px",
            background: D.primary,
            color: "#fff",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          Download for macOS
        </a>
        <div style={{ marginTop: 8, fontSize: 12, color: D.onSurfaceVariant }}>
          macOS 12 (Monterey) or later · Apple Silicon &amp; Intel · ~95 MB
        </div>
      </div>

      <Step n={1} title="Open the .dmg file">
        Double-click the downloaded <code style={ic}>Vinexus-mac.dmg</code> file. A Finder window will open showing the Vinexus app and your Applications folder.
      </Step>

      <Step n={2} title="Drag to Applications">
        Drag the Vinexus icon to the Applications folder shortcut in the Finder window. Wait for the copy to finish, then eject the disk image.
      </Step>

      <Step n={3} title="Open Vinexus (bypass Gatekeeper)">
        <div>
          macOS will block the app on first launch since it was downloaded from the internet. To open it:
          <ol style={{ paddingLeft: 20, marginTop: 8, lineHeight: 2.1, color: D.onSurfaceVariant }}>
            <li>Open <strong style={{ color: D.onSurface }}>Finder → Applications</strong></li>
            <li>Right-click (or Control-click) on Vinexus</li>
            <li>Click <strong style={{ color: D.onSurface }}>Open</strong> in the context menu</li>
            <li>Click <strong style={{ color: D.onSurface }}>Open</strong> again in the confirmation dialog</li>
          </ol>
          <div style={{ marginTop: 10, fontSize: 13, color: D.onSurfaceVariant }}>
            You only need to do this once. After the first launch, Vinexus opens normally.
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: D.onSurfaceVariant }}>
            Or, remove the quarantine flag in Terminal:
          </div>
          <Code>{`xattr -dr com.apple.quarantine /Applications/Vinexus.app`}</Code>
        </div>
      </Step>

      <Step n={4} title="Connect to your VM">
        Vinexus will open to the connection screen. Enter your VM&apos;s IP address, SSH username, and your private key file (or password) and click Connect.
      </Step>
    </div>
  );
}

function WindowsContent() {
  const { D } = useTheme();
  const ic: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: D.onSurface,
    background: D.surfaceContainer,
    padding: "2px 6px",
    borderRadius: 3,
  };
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 24px",
            background: D.primary,
            color: "#fff",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12V6.75l6-1.32v6.57H3zm17 0V5l-9 1.68V12h9zM3 13h6v6.57l-6-1.32V13zm17 0h-9v5.32L20 20V13z"/></svg>
          Download for Windows
        </a>
        <div style={{ marginTop: 8, fontSize: 12, color: D.onSurfaceVariant }}>
          Windows 10 (1903) or later · x86_64 · ~110 MB
        </div>
      </div>

      <Step n={1} title="Run the installer">
        Double-click <code style={ic}>Vinexus-Setup.exe</code>. If Windows SmartScreen appears, click <strong style={{ color: D.onSurface }}>More info</strong> then <strong style={{ color: D.onSurface }}>Run anyway</strong>. This is expected for new applications that haven&apos;t yet built up a SmartScreen reputation.
      </Step>

      <Step n={2} title="Follow the setup wizard">
        Accept the license agreement, choose an installation folder (the default is fine), and click <strong style={{ color: D.onSurface }}>Install</strong>. The wizard will create Start Menu and Desktop shortcuts automatically.
      </Step>

      <Step n={3} title="Allow firewall access">
        On first launch, Windows Defender Firewall will ask whether to allow Vinexus through. Click <strong style={{ color: D.onSurface }}>Allow access</strong> — Vinexus needs outbound access to reach your VM over SSH.
      </Step>

      <Step n={4} title="Connect to your VM">
        Vinexus will open to the connection screen. Enter your VM&apos;s IP address, SSH username, and private key file (or password) and click Connect.
      </Step>

      <div style={{ marginTop: 8, padding: "14px 16px", background: D.surfaceContainerHigh, borderRadius: 6, fontSize: 13, color: D.onSurfaceVariant }}>
        <strong style={{ color: D.onSurface }}>winget (coming soon):</strong> Once published to the Windows Package Manager registry, you will be able to run{" "}
        <code style={ic}>winget install Vinexus.Desktop</code>.
      </div>
    </div>
  );
}

function LinuxContent() {
  const { D } = useTheme();
  const ic: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: D.onSurface,
    background: D.surfaceContainer,
    padding: "2px 6px",
    borderRadius: 3,
  };

  const [linuxVariant, setLinuxVariant] = useState<"appimage" | "deb" | "rpm" | "arch">("appimage");

  const tabs: { id: typeof linuxVariant; label: string }[] = [
    { id: "appimage", label: "AppImage (universal)" },
    { id: "deb",      label: "Debian / Ubuntu" },
    { id: "rpm",      label: "Fedora / RHEL" },
    { id: "arch",     label: "Arch (AUR)" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 24px",
            background: D.primary,
            color: "#fff",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155 0-.315.008-.48.021C7.576.172 3.01 3.533 1.22 8.228c-1.239 3.318-.886 7.182 1.09 10.095 1.537 2.25 3.914 3.855 6.539 4.398.16.034.32-.044.384-.192l.656-1.552c.066-.155.008-.336-.136-.427-2.32-1.434-3.789-3.96-3.789-6.734 0-4.348 3.538-7.885 7.887-7.885 4.348 0 7.887 3.537 7.887 7.885 0 2.774-1.47 5.3-3.79 6.734-.143.09-.202.272-.135.427l.657 1.552c.064.148.224.226.384.192 2.626-.543 5.003-2.148 6.54-4.398 1.975-2.913 2.329-6.777 1.09-10.095C20.992 3.533 16.426.172 12.984.021 12.819.008 12.659 0 12.504 0z"/></svg>
          Download for Linux
        </a>
        <div style={{ marginTop: 8, fontSize: 12, color: D.onSurfaceVariant }}>
          Any distro with glibc 2.17+ · x86_64 &amp; ARM64 · ~100 MB
        </div>
      </div>

      {/* Linux variant tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: D.surfaceContainerHigh, padding: 3, borderRadius: 6, width: "fit-content" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setLinuxVariant(t.id)}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: linuxVariant === t.id ? 600 : 400,
              background: linuxVariant === t.id ? D.surfaceLowest : "transparent",
              color: linuxVariant === t.id ? D.onSurface : D.onSurfaceVariant,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {linuxVariant === "appimage" && (
        <>
          <Step n={1} title="Download the AppImage">
            <div>
              The AppImage works on any Linux distro with no installation required.
              <Code>{`curl -Lo Vinexus.AppImage https://download.vinexus.dev/latest/Vinexus.AppImage`}</Code>
            </div>
          </Step>
          <Step n={2} title="Make it executable">
            <Code>{`chmod +x Vinexus.AppImage`}</Code>
          </Step>
          <Step n={3} title="Run Vinexus">
            <div>
              <Code>{`./Vinexus.AppImage`}</Code>
              <div style={{ marginTop: 8 }}>
                To add it to your application launcher, move it to <code style={ic}>~/.local/bin/</code> and run <code style={ic}>./Vinexus.AppImage --install</code> to register a desktop entry.
              </div>
            </div>
          </Step>
        </>
      )}

      {linuxVariant === "deb" && (
        <>
          <Step n={1} title="Download the .deb package">
            <Code>{`curl -Lo vinexus.deb https://download.vinexus.dev/latest/Vinexus.deb`}</Code>
          </Step>
          <Step n={2} title="Install with dpkg">
            <div>
              <Code>{`sudo dpkg -i vinexus.deb
# Fix any missing dependencies:
sudo apt-get install -f`}</Code>
            </div>
          </Step>
          <Step n={3} title="Launch">
            <Code>{`vinexus`}</Code>
          </Step>
        </>
      )}

      {linuxVariant === "rpm" && (
        <>
          <Step n={1} title="Download the .rpm package">
            <Code>{`curl -Lo vinexus.rpm https://download.vinexus.dev/latest/Vinexus.rpm`}</Code>
          </Step>
          <Step n={2} title="Install with dnf (recommended)">
            <div>
              <Code>{`sudo dnf install vinexus.rpm`}</Code>
              <div style={{ marginTop: 8 }}>Or with rpm directly:</div>
              <Code>{`sudo rpm -i vinexus.rpm`}</Code>
            </div>
          </Step>
          <Step n={3} title="Launch">
            <Code>{`vinexus`}</Code>
          </Step>
        </>
      )}

      {linuxVariant === "arch" && (
        <>
          <Step n={1} title="Install from AUR">
            <div>
              <Code>{`# Using yay
yay -S vinexus-desktop

# Using paru
paru -S vinexus-desktop`}</Code>
            </div>
          </Step>
          <Step n={2} title="Launch">
            <Code>{`vinexus`}</Code>
          </Step>
        </>
      )}

      <div style={{ marginTop: 16, padding: "14px 16px", background: D.surfaceContainerHigh, borderRadius: 6, fontSize: 13, color: D.onSurfaceVariant }}>
        <strong style={{ color: D.onSurface }}>Missing libraries?</strong> Run:{" "}
        <code style={ic}>sudo apt-get install libgtk-3-0 libnss3 libxss1 libxtst6</code>{" "}
        (Debian/Ubuntu) or{" "}
        <code style={ic}>sudo dnf install gtk3 nss libXScrnSaver libXtst</code>{" "}
        (Fedora/RHEL).
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function DownloadPage() {
  const { D } = useTheme();
  const [platform, setPlatform] = useState<Platform>("macos");

  const platformTabs: { id: Platform; label: string; icon: React.ReactNode }[] = [
    {
      id: "macos",
      label: "macOS",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
    },
    {
      id: "windows",
      label: "Windows",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12V6.75l6-1.32v6.57H3zm17 0V5l-9 1.68V12h9zM3 13h6v6.57l-6-1.32V13zm17 0h-9v5.32L20 20V13z"/>
        </svg>
      ),
    },
    {
      id: "linux",
      label: "Linux",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.504 0c-.155 0-.315.008-.48.021C7.576.172 3.01 3.533 1.22 8.228c-1.239 3.318-.886 7.182 1.09 10.095 1.537 2.25 3.914 3.855 6.539 4.398.16.034.32-.044.384-.192l.656-1.552c.066-.155.008-.336-.136-.427-2.32-1.434-3.789-3.96-3.789-6.734 0-4.348 3.538-7.885 7.887-7.885 4.348 0 7.887 3.537 7.887 7.885 0 2.774-1.47 5.3-3.79 6.734-.143.09-.202.272-.135.427l.657 1.552c.064.148.224.226.384.192 2.626-.543 5.003-2.148 6.54-4.398 1.975-2.913 2.329-6.777 1.09-10.095C20.992 3.533 16.426.172 12.984.021 12.819.008 12.659 0 12.504 0z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ background: D.surface, minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: D.surfaceContainerLow, borderBottom: `1px solid ${D.outlineVariant}`, padding: "64px 24px 56px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 16 }}>Free to start</p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 18px" }}>
            Download Vinexus
          </h1>
          <p style={{ fontSize: 16, color: D.onSurfaceVariant, margin: "0 auto 36px", maxWidth: 480, lineHeight: 1.65 }}>
            A native desktop IDE that connects directly to your virtual machines. macOS, Windows, and Linux — any kernel, any distro.
          </p>

          {/* Platform tabs */}
          <div style={{ display: "inline-flex", gap: 2, background: D.surfaceContainerHigh, padding: 4, borderRadius: 8 }}>
            {platformTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setPlatform(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: platform === tab.id ? 600 : 500,
                  background: platform === tab.id ? D.surfaceLowest : "transparent",
                  color: platform === tab.id ? D.onSurface : D.onSurfaceVariant,
                  border: platform === tab.id ? `1px solid ${D.outlineVariant}` : "1px solid transparent",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {platform === "macos"   && <MacOSContent />}
        {platform === "windows" && <WindowsContent />}
        {platform === "linux"   && <LinuxContent />}

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, padding: "28px 28px", background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`, borderRadius: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.onSurface, marginBottom: 6 }}>Need SSH help or want paid features?</div>
          <div style={{ fontSize: 13, color: D.onSurfaceVariant, marginBottom: 16, lineHeight: 1.65 }}>
            Read the full setup guide to connect to your VM, configure IP whitelisting, and enable Claude Code AI integration.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/docs" style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#fff", background: D.primary, borderRadius: 5, textDecoration: "none" }}>
              Read the docs
            </Link>
            <Link href="/pricing" style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: D.onSurface, background: D.surfaceContainerHigh, border: `1px solid ${D.outlineVariant}`, borderRadius: 5, textDecoration: "none" }}>
              View pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
