"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme, Theme } from "@/lib/ThemeContext";

// ── Style factory (called inside each component with live D) ───────
function makeS(D: Theme) {
  return {
    para:   { fontSize: 14, color: D.onSurfaceVariant, lineHeight: 1.75, marginBottom: 18 } as React.CSSProperties,
    h3:     { fontSize: 15, fontWeight: 700, color: D.onSurface, letterSpacing: "-0.02em", marginTop: 32, marginBottom: 12 } as React.CSSProperties,
    list:   { paddingLeft: 22, marginBottom: 18, fontSize: 14, color: D.onSurfaceVariant, lineHeight: 2 } as React.CSSProperties,
    strong: { color: D.onSurface, fontWeight: 600 } as React.CSSProperties,
    link:   { color: D.primary, textDecoration: "none", fontWeight: 500 } as React.CSSProperties,
    inlineCode: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: D.onSurface,
      background: D.surfaceContainer,
      padding: "2px 6px",
      borderRadius: 3,
    } as React.CSSProperties,
  };
}

// ── Sidebar sections ──────────────────────────────────────────────
const SECTIONS = [
  { id: "getting-started",    label: "Getting Started" },
  { id: "install-macos",      label: "Installing on macOS" },
  { id: "install-windows",    label: "Installing on Windows" },
  { id: "install-linux",      label: "Installing on Linux" },
  { id: "setup-vm",           label: "Setting Up Your Cloud VM" },
  { id: "ip-whitelisting",    label: "IP Whitelisting" },
  { id: "connecting",         label: "Connecting to Your VM" },
  { id: "claude-integration", label: "Claude Code Integration" },
  { id: "editor",             label: "Editor Features" },
  { id: "terminal",           label: "Terminal" },
  { id: "server-deploy",      label: "Server Management & Deploy" },
  { id: "troubleshooting",    label: "Troubleshooting" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

// ── Code block ────────────────────────────────────────────────────
// Always dark background (terminal-style) regardless of theme
const CODE_BG = "#0d1117";
const CODE_TEXT = "#c9d1d9";
const CODE_COMMENT = "#6e7681";

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const { D } = useTheme();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{
      position: "relative",
      background: CODE_BG,
      borderRadius: 6,
      padding: "16px 16px",
      marginBottom: 20,
      overflowX: "auto",
    }}>
      {lang && (
        <div style={{ fontSize: 11, fontWeight: 600, color: CODE_COMMENT, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{lang}</div>
      )}
      <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: CODE_TEXT, lineHeight: 1.75 }}>{children}</pre>
      <button onClick={copy} style={{
        position: "absolute", top: 10, right: 10,
        background: "rgba(155,178,229,0.1)", border: `1px solid ${D.outlineVariant}`,
        borderRadius: 4, padding: "3px 10px",
        fontSize: 11, color: copied ? "#3fb950" : CODE_COMMENT,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

// ── Warning / Info boxes ──────────────────────────────────────────
function Warning({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div style={{
      background: isDark ? "rgba(161,98,7,0.15)" : "#fefce8",
      borderLeft: "3px solid #a16207",
      padding: "12px 16px",
      marginBottom: 20,
      borderRadius: "0 4px 4px 0",
    }}>
      <span style={{ fontSize: 14, color: isDark ? "#fbbf24" : "#78350f", lineHeight: 1.65 }}>{children}</span>
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  const { D, isDark } = useTheme();
  return (
    <div style={{
      background: isDark ? D.primaryContainer : "#e8f0fe",
      borderLeft: `3px solid ${D.primary}`,
      padding: "12px 16px",
      marginBottom: 20,
      borderRadius: "0 4px 4px 0",
    }}>
      <span style={{ fontSize: 14, color: D.onSurface, lineHeight: 1.65 }}>{children}</span>
    </div>
  );
}

// ── Section components ────────────────────────────────────────────

function GettingStarted() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Vinexus is a native desktop IDE built for developers who work on remote virtual machines. Instead of browser-based tools or raw SSH sessions, Vinexus gives you a professional development environment — Monaco editor, integrated terminal, file explorer, git, and deploy tools — all connected directly to your VM over SSH.
      </p>

      <h3 style={S.h3}>What is Vinexus?</h3>
      <p style={S.para}>
        Vinexus is a desktop application (macOS, Windows, and Linux) that establishes a direct SSH connection to your virtual machine. There is no cloud infrastructure in the middle — your SSH credentials stay on your local machine, files are read and written via SFTP, and the terminal is a genuine PTY session on your server. Vinexus stores nothing about your code or credentials.
      </p>

      <h3 style={S.h3}>System Requirements</h3>
      <ul style={S.list}>
        <li><strong style={S.strong}>macOS:</strong> macOS 12 (Monterey) or later. Apple Silicon (M1/M2/M3/M4) and Intel both supported.</li>
        <li><strong style={S.strong}>Windows:</strong> Windows 10 version 1903 or later. x86_64 architecture.</li>
        <li><strong style={S.strong}>Linux:</strong> Any distribution with glibc 2.17+. Includes Ubuntu, Debian, Fedora, Arch, Alpine, and more. x86_64 and ARM64 supported.</li>
        <li><strong style={S.strong}>RAM:</strong> 4 GB minimum, 8 GB recommended.</li>
        <li><strong style={S.strong}>Network:</strong> Internet connection required to reach your VM via SSH.</li>
      </ul>

      <h3 style={S.h3}>Download</h3>
      <p style={S.para}>
        Download the latest Vinexus installer from the <Link href="/download" style={S.link}>download page</Link>. Choose the installer for your platform:
      </p>
      <ul style={S.list}>
        <li><strong style={S.strong}>macOS:</strong> <code style={S.inlineCode}>Vinexus-mac.dmg</code></li>
        <li><strong style={S.strong}>Windows:</strong> <code style={S.inlineCode}>Vinexus-Setup.exe</code></li>
        <li><strong style={S.strong}>Linux:</strong> <code style={S.inlineCode}>Vinexus.AppImage</code> or <code style={S.inlineCode}>.deb</code> / <code style={S.inlineCode}>.rpm</code></li>
      </ul>
    </>
  );
}

function InstallMacOS() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Installing Vinexus on macOS takes about two minutes. Follow these steps to get set up.
      </p>

      <h3 style={S.h3}>Step 1: Download the .dmg</h3>
      <p style={S.para}>
        Download <code style={S.inlineCode}>Vinexus-mac.dmg</code> from the <Link href="/download" style={S.link}>download page</Link>.
      </p>

      <h3 style={S.h3}>Step 2: Install to Applications</h3>
      <p style={S.para}>
        Open the downloaded <code style={S.inlineCode}>.dmg</code> file. In the Finder window that appears, drag the Vinexus icon to the Applications folder shortcut. Wait for the copy to complete, then eject the disk image.
      </p>

      <h3 style={S.h3}>Step 3: First Launch (Gatekeeper)</h3>
      <p style={S.para}>
        On first launch, macOS Gatekeeper will block Vinexus because it was downloaded from the internet. To open it:
      </p>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>In Finder, navigate to your Applications folder.</li>
        <li>Right-click (or Control-click) on Vinexus.</li>
        <li>Click <strong style={S.strong}>Open</strong> in the context menu.</li>
        <li>In the dialog that appears, click <strong style={S.strong}>Open</strong> again to confirm.</li>
      </ol>
      <p style={S.para}>
        You only need to do this once. After the first launch, Vinexus will open normally.
      </p>

      <h3 style={S.h3}>Alternative: System Settings approach</h3>
      <p style={S.para}>
        If you see a dialog saying the app cannot be opened, go to <strong style={S.strong}>System Settings → Privacy &amp; Security</strong>. Scroll down to the Security section and click <strong style={S.strong}>Open Anyway</strong> next to the Vinexus message.
      </p>

      <h3 style={S.h3}>Alternative: Command-line quarantine removal</h3>
      <CodeBlock lang="bash">{`xattr -dr com.apple.quarantine /Applications/Vinexus.app`}</CodeBlock>

      <Info>
        This command is safe and simply tells macOS that you explicitly trust this application. It is equivalent to clicking &quot;Open Anyway&quot; in System Settings.
      </Info>
    </>
  );
}

function InstallWindows() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Vinexus on Windows installs like any standard application. The setup wizard handles everything automatically.
      </p>

      <h3 style={S.h3}>Step 1: Download the installer</h3>
      <p style={S.para}>
        Download <code style={S.inlineCode}>Vinexus-Setup.exe</code> from the <Link href="/download" style={S.link}>download page</Link>.
      </p>

      <h3 style={S.h3}>Step 2: Run the installer</h3>
      <p style={S.para}>
        Double-click <code style={S.inlineCode}>Vinexus-Setup.exe</code> to launch the installer. Click through the setup wizard — accept the license agreement, choose an installation folder (the default is recommended), and click Install. The installer will create Start Menu and Desktop shortcuts automatically.
      </p>

      <h3 style={S.h3}>Windows Defender SmartScreen</h3>
      <p style={S.para}>
        Windows may show a SmartScreen warning the first time you run the installer. To proceed:
      </p>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Click <strong style={S.strong}>More info</strong> on the SmartScreen dialog.</li>
        <li>Click <strong style={S.strong}>Run anyway</strong>.</li>
      </ol>

      <h3 style={S.h3}>Windows Defender Firewall</h3>
      <p style={S.para}>
        On first launch, Windows may ask whether to allow Vinexus through the firewall. Click <strong style={S.strong}>Allow access</strong> — Vinexus needs outbound access to establish SSH connections to your VM.
      </p>

      <h3 style={S.h3}>winget (coming soon)</h3>
      <CodeBlock lang="powershell">{`winget install Vinexus.Desktop`}</CodeBlock>
      <Info>winget installation is coming soon. For now, use the .exe installer from the download page.</Info>
    </>
  );
}

function InstallLinux() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Vinexus runs on any Linux distribution with glibc 2.17 or later. This includes Ubuntu, Debian, Fedora, Arch Linux, openSUSE, Alpine (via compatibility layer), and any other mainstream distro. Both x86_64 and ARM64 (including Raspberry Pi 4+) are supported.
      </p>

      <h3 style={S.h3}>AppImage (Universal — recommended)</h3>
      <p style={S.para}>
        The AppImage works on any distro with no installation required. Download it, mark it executable, and run it.
      </p>
      <CodeBlock lang="bash">{`# Download the AppImage
curl -Lo Vinexus.AppImage https://download.vinexus.dev/latest/Vinexus.AppImage

# Mark it executable
chmod +x Vinexus.AppImage

# Run it
./Vinexus.AppImage`}</CodeBlock>
      <p style={S.para}>
        To integrate it into your application launcher, move it to <code style={S.inlineCode}>~/.local/bin/</code> and create a <code style={S.inlineCode}>.desktop</code> entry.
      </p>

      <h3 style={S.h3}>Debian / Ubuntu (.deb)</h3>
      <CodeBlock lang="bash">{`# Download the .deb package
curl -Lo vinexus.deb https://download.vinexus.dev/latest/Vinexus.deb

# Install with dpkg
sudo dpkg -i vinexus.deb

# Fix any missing dependencies
sudo apt-get install -f

# Launch
vinexus`}</CodeBlock>

      <h3 style={S.h3}>Fedora / RHEL / CentOS (.rpm)</h3>
      <CodeBlock lang="bash">{`# Download the .rpm package
curl -Lo vinexus.rpm https://download.vinexus.dev/latest/Vinexus.rpm

# Install with rpm
sudo rpm -i vinexus.rpm

# Or using dnf (auto-resolves dependencies)
sudo dnf install vinexus.rpm

# Launch
vinexus`}</CodeBlock>

      <h3 style={S.h3}>Arch Linux (AUR)</h3>
      <CodeBlock lang="bash">{`# Using yay
yay -S vinexus-desktop

# Using paru
paru -S vinexus-desktop`}</CodeBlock>

      <h3 style={S.h3}>Required Dependencies</h3>
      <p style={S.para}>Most systems have these already. If Vinexus fails to start, install:</p>
      <CodeBlock lang="bash">{`# Ubuntu / Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora / RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils`}</CodeBlock>

      <Info>
        Vinexus connects to your <em>remote</em> VM over SSH — the Linux kernel version of the host running Vinexus does not affect compatibility with your server. Any kernel, any distro.
      </Info>
    </>
  );
}

function SetupVM() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Vinexus connects to any Linux server accessible via SSH. Here is how to set up a cloud VM with the three most popular providers.
      </p>

      <h3 style={S.h3}>AWS EC2</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Open the <strong style={S.strong}>EC2 Console</strong> and click <strong style={S.strong}>Launch Instance</strong>.</li>
        <li>Choose <strong style={S.strong}>Ubuntu Server 22.04 LTS</strong> (free tier eligible on t2.micro).</li>
        <li>Under <strong style={S.strong}>Key pair</strong>, create a new key pair or select an existing one. Download the <code style={S.inlineCode}>.pem</code> file — you will need it to connect.</li>
        <li>Under <strong style={S.strong}>Network settings</strong>, create a Security Group that allows SSH (port 22) from your IP only. Run <code style={S.inlineCode}>curl ifconfig.me</code> in your terminal to find your current public IP.</li>
        <li>Launch the instance and wait for it to reach the <strong style={S.strong}>running</strong> state.</li>
      </ol>
      <CodeBlock lang="bash">{`# Fix key permissions (required on macOS/Linux)
chmod 400 my-key.pem

# Test your connection
ssh -i my-key.pem ubuntu@<your-ec2-public-ip>`}</CodeBlock>

      <h3 style={S.h3}>DigitalOcean Droplet</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>In the DigitalOcean console, click <strong style={S.strong}>Create → Droplets</strong>.</li>
        <li>Choose <strong style={S.strong}>Ubuntu 22.04 (LTS)</strong> and a Basic plan (the $6/mo shared CPU is fine for most projects).</li>
        <li>Under <strong style={S.strong}>Authentication</strong>, select <strong style={S.strong}>SSH Key</strong> and add your public key.</li>
        <li>Choose a data center region close to you and click <strong style={S.strong}>Create Droplet</strong>.</li>
      </ol>
      <CodeBlock lang="bash">{`# Connect as root (DigitalOcean default)
ssh root@<droplet-ip>`}</CodeBlock>

      <h3 style={S.h3}>Any VPS or Self-Hosted Server</h3>
      <p style={S.para}>Vinexus works with any SSH-accessible server. Make sure SSH is running and your firewall allows port 22.</p>
      <CodeBlock lang="bash">{`# Check if SSH is running on your server
sudo systemctl status ssh

# Start SSH if it's not running
sudo systemctl start ssh
sudo systemctl enable ssh

# Find your server's public IP
curl ifconfig.me`}</CodeBlock>

      <p style={S.para}>If you do not have an SSH key yet, generate one on your local machine:</p>
      <CodeBlock lang="bash">{`# Generate a new SSH key (on your local machine)
ssh-keygen -t ed25519 -C "vinexus"

# Copy public key to your server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@<server-ip>

# Or manually append to authorized_keys on the server:
echo "$(cat ~/.ssh/id_ed25519.pub)" >> ~/.ssh/authorized_keys`}</CodeBlock>
    </>
  );
}

function IPWhitelisting() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        IP whitelisting restricts SSH access to your VM to only your specific IP address. This is one of the most effective defenses against brute-force attacks. Since Vinexus connects directly from your machine — no Vinexus servers in the middle — you only need to whitelist your own computer&apos;s public IP.
      </p>

      <h3 style={S.h3}>Find Your Public IP</h3>
      <CodeBlock lang="bash">{`# Run this on your local machine (the one running Vinexus)
curl ifconfig.me`}</CodeBlock>

      <h3 style={S.h3}>Linux ufw (Ubuntu / Debian)</h3>
      <CodeBlock lang="bash">{`# Allow SSH only from your IP
sudo ufw allow from <YOUR_IP> to any port 22

# Enable the firewall (if not already enabled)
sudo ufw enable

# Verify the rules
sudo ufw status`}</CodeBlock>

      <Warning>
        <strong>If your ISP gives you a dynamic IP address</strong>, your IP will change periodically. When this happens, you will lose SSH access and will need to update the firewall rule. Consider using a static IP or allowlisting a /24 CIDR range if you always connect from the same network.
      </Warning>

      <h3 style={S.h3}>AWS Security Groups</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Open the EC2 console and navigate to <strong style={S.strong}>Security Groups</strong>.</li>
        <li>Select the security group attached to your instance.</li>
        <li>Click <strong style={S.strong}>Edit inbound rules → Add rule</strong>.</li>
        <li>Set Type to <strong style={S.strong}>SSH</strong>, Port to <strong style={S.strong}>22</strong>.</li>
        <li>Under Source, select <strong style={S.strong}>My IP</strong> — AWS will auto-fill your current IP.</li>
        <li>Click <strong style={S.strong}>Save rules</strong>.</li>
      </ol>

      <h3 style={S.h3}>DigitalOcean Firewall</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Go to <strong style={S.strong}>Networking → Firewalls → Create Firewall</strong>.</li>
        <li>Under Inbound Rules, add: Type <strong style={S.strong}>SSH</strong>, Sources set to your IP address.</li>
        <li>Apply the firewall to your droplet and click <strong style={S.strong}>Create Firewall</strong>.</li>
      </ol>

      <Info>
        Because Vinexus connects directly from your desktop, you only ever need to whitelist the IP of the machine running Vinexus — not any Vinexus server IPs.
      </Info>
    </>
  );
}

function Connecting() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Once your VM is running and your firewall is configured, connecting with Vinexus takes about 30 seconds.
      </p>

      <h3 style={S.h3}>Step-by-Step Connection</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Open Vinexus and click <strong style={S.strong}>New Connection</strong> (or press Cmd/Ctrl+N).</li>
        <li>Fill in the connection details:
          <ul style={{ marginTop: 8, lineHeight: 2 }}>
            <li><strong style={S.strong}>Host:</strong> Your VM&apos;s public IP address (e.g., <code style={S.inlineCode}>203.0.113.42</code>)</li>
            <li><strong style={S.strong}>Port:</strong> 22 (default SSH port)</li>
            <li><strong style={S.strong}>Username:</strong> <code style={S.inlineCode}>ubuntu</code> for Ubuntu/AWS, <code style={S.inlineCode}>root</code> for DigitalOcean, or your custom username</li>
          </ul>
        </li>
        <li>Choose authentication:
          <ul style={{ marginTop: 8, lineHeight: 2 }}>
            <li><strong style={S.strong}>SSH Key:</strong> Browse to your private key file (<code style={S.inlineCode}>.pem</code> or <code style={S.inlineCode}>id_ed25519</code>) — recommended</li>
            <li><strong style={S.strong}>Password:</strong> Enter your SSH password</li>
          </ul>
        </li>
        <li>Click <strong style={S.strong}>Connect</strong>. Vinexus opens the file explorer, editor, and terminal simultaneously.</li>
      </ol>

      <Info>
        SSH Key authentication is strongly recommended. It is more secure than passwords and eliminates the need to type credentials on every connection.
      </Info>

      <h3 style={S.h3}>Troubleshooting Connection Issues</h3>
      <p style={S.para}><strong style={S.strong}>Connection refused:</strong></p>
      <ul style={S.list}>
        <li>Check that SSH is running: <code style={S.inlineCode}>sudo systemctl status ssh</code></li>
        <li>Verify your security group / firewall allows port 22 from your IP</li>
      </ul>

      <p style={S.para}><strong style={S.strong}>Permission denied (publickey):</strong></p>
      <ul style={S.list}>
        <li>Verify the username is correct for your server</li>
        <li>Check key permissions: <code style={S.inlineCode}>chmod 600 ~/.ssh/id_ed25519</code></li>
        <li>Ensure the public key is in <code style={S.inlineCode}>~/.ssh/authorized_keys</code> on the server</li>
      </ul>

      <p style={S.para}><strong style={S.strong}>Timeout / no route to host:</strong></p>
      <ul style={S.list}>
        <li>Confirm the IP is correct and the VM is running</li>
        <li>Run <code style={S.inlineCode}>curl ifconfig.me</code> to verify your current public IP has not changed</li>
      </ul>
    </>
  );
}

function ClaudeIntegration() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Claude Code is Anthropic&apos;s agentic AI coding assistant. By installing it directly on your VM, you can run it from the Vinexus integrated terminal and get full AI pair programming — Claude can read files, write code, run tests, and execute commands on your server with your approval at each step.
      </p>

      <Info>
        <strong>Available on all plans.</strong> Claude Code and other terminal-based AI tools (Aider, etc.) run directly on your VM — any Vinexus plan can use them. Premium and Max plans also include built-in AI hints; bring your own API key to use any tool on the Free plan.
      </Info>

      <h3 style={S.h3}>Requirements</h3>
      <ul style={S.list}>
        <li>Any Vinexus plan (Free, Premium, or Max)</li>
        <li>Node.js 18+ installed on your VM</li>
        <li>An Anthropic API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={S.link}>console.anthropic.com</a></li>
      </ul>

      <h3 style={S.h3}>Install on Your VM</h3>
      <CodeBlock lang="bash">{`# Step 1: Install Node.js 18+ if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version`}</CodeBlock>

      <CodeBlock lang="bash">{`# Step 2: Install Claude Code globally on your VM
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version`}</CodeBlock>

      <CodeBlock lang="bash">{`# Step 3: Set your Anthropic API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Step 4: Start Claude Code
claude`}</CodeBlock>

      <h3 style={S.h3}>Make the API Key Permanent</h3>
      <CodeBlock lang="bash">{`# Add to .bashrc (bash) or .zshrc (zsh)
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.bashrc
source ~/.bashrc`}</CodeBlock>

      <Warning>
        Never commit your <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>ANTHROPIC_API_KEY</code> to version control. Use environment variables or a secrets manager to keep it secure.
      </Warning>

      <h3 style={S.h3}>Using Claude Code in the Vinexus Terminal</h3>
      <CodeBlock lang="bash">{`ubuntu@prod-server:~/app$ claude

Claude Code ready. Type a message or '/help' for commands.

> fix the memory leak in src/worker.ts

I'll analyze worker.ts for memory leaks...
Reading file src/worker.ts (142 lines)

Found: EventEmitter listener added in startWorker() is never
removed in the cleanup() method, causing leaks on every restart.

Applying fix...
  - Added: emitter.off('data', handler) in cleanup()
  - Added: emitter.removeAllListeners() as fallback
✓ Fixed. Would you like me to add a test for this case?`}</CodeBlock>
    </>
  );
}

function EditorFeatures() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        Vinexus uses Monaco — the same editor engine that powers Visual Studio Code — for all code editing. Files are read and written directly over SFTP, so changes appear on your VM immediately when you save.
      </p>

      <h3 style={S.h3}>Syntax Highlighting</h3>
      <p style={S.para}>
        Monaco automatically detects the language from your file extension and applies syntax highlighting. 50+ languages are supported out of the box: JavaScript, TypeScript, Python, Go, Rust, Java, C/C++, Ruby, PHP, YAML, JSON, Markdown, and many more.
      </p>

      <h3 style={S.h3}>Keyboard Shortcuts</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          ["Save file", "Ctrl/Cmd + S"],
          ["Find", "Ctrl/Cmd + F"],
          ["Find & Replace", "Ctrl/Cmd + H"],
          ["Go to line", "Ctrl/Cmd + G"],
          ["Toggle comment", "Ctrl/Cmd + /"],
          ["Format document", "Shift + Alt + F"],
          ["Multiple cursors", "Alt + Click"],
          ["Command palette", "F1"],
        ].map(([action, shortcut]) => (
          <div key={action} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: D.surfaceLowest, border: `1px solid ${D.outlineVariant}`, borderRadius: 6 }}>
            <span style={{ fontSize: 13, color: D.onSurface }}>{action}</span>
            <code style={{ ...S.inlineCode, fontSize: 11 }}>{shortcut}</code>
          </div>
        ))}
      </div>

      <h3 style={S.h3}>Multi-File Tabs</h3>
      <p style={S.para}>
        Open multiple files and switch between them using tabs at the top of the editor. Unsaved changes are indicated by a dot on the tab. Tabs persist across reconnections.
      </p>

      <h3 style={S.h3}>Find &amp; Replace</h3>
      <p style={S.para}>
        Press <code style={S.inlineCode}>Ctrl/Cmd+F</code> to open the find bar. Press <code style={S.inlineCode}>Ctrl/Cmd+H</code> for find-and-replace with regex support.
      </p>
    </>
  );
}

function Terminal() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        The Vinexus terminal is a full PTY (pseudo-terminal) session over SSH. It behaves exactly like a native terminal — interactive programs, colors, tab completion, and Ctrl+C all work as expected.
      </p>

      <h3 style={S.h3}>Features</h3>
      <ul style={S.list}>
        <li>Full 256-color and true color support</li>
        <li>Tab completion and command history (up/down arrows)</li>
        <li>Scrollback buffer for reviewing previous output</li>
        <li>Multiple terminal instances — open tabs as needed</li>
        <li>Copy: <code style={S.inlineCode}>Cmd+C</code> (macOS) or <code style={S.inlineCode}>Ctrl+Shift+C</code> (Windows/Linux)</li>
        <li>Paste: <code style={S.inlineCode}>Cmd+V</code> (macOS) or <code style={S.inlineCode}>Ctrl+Shift+V</code> (Windows/Linux)</li>
        <li>Uses your VM&apos;s default shell (bash, zsh, fish, etc.)</li>
      </ul>

      <h3 style={S.h3}>Preventing SSH Timeouts</h3>
      <CodeBlock lang="bash">{`# Edit ~/.ssh/config on your local machine
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3`}</CodeBlock>
      <p style={S.para}>
        This sends a keepalive packet every 60 seconds and allows up to 3 missed responses before disconnecting.
      </p>
    </>
  );
}

function ServerDeploy() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <p style={S.para}>
        The Vinexus Deploy panel gives you a one-click deployment pipeline that runs directly on your VM. It reads its configuration from a <code style={S.inlineCode}>.vmide.json</code> file you create on the server, then handles saving files, running validation checks, executing pre/post-deploy hooks, restarting your service, and automatically rolling back if anything fails.
      </p>

      <h3 style={S.h3}>How it works</h3>
      <p style={S.para}>When you click <strong style={S.strong}>Deploy Now</strong> in the Deploy tab, Vinexus runs a pipeline of steps in order:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
        {[
          ["Save Files",     "Writes any unsaved editor files to the VM over SFTP."],
          ["Validate",       "Runs your preValidate commands (e.g. lint, type-check, unit tests). Stops the pipeline on any failure."],
          ["Create Backup",  "Backs up key files before making changes so rollback has something to restore."],
          ["Deploy Service", "Runs preDeployHooks, restarts your service, then runs postDeployHooks."],
          ["Check Status",   "Verifies the service is running and healthy after the restart."],
          ["Fetch Logs",     "Pulls the first few log lines from your service to confirm it started cleanly."],
        ].map(([name, desc]) => (
          <div key={name} style={{ display: "flex", gap: 12, padding: "10px 14px", background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`, borderRadius: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: D.primary, whiteSpace: "nowrap", minWidth: 110 }}>{name}</span>
            <span style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.55 }}>{desc}</span>
          </div>
        ))}
      </div>
      <p style={S.para}>
        If any step fails and <code style={S.inlineCode}>autoRollbackOnFailure</code> is enabled, Vinexus immediately triggers a rollback to restore the backed-up state. You can also manually trigger a rollback by clicking the <strong style={S.strong}>Rollback</strong> button after a failed deploy.
      </p>

      <h3 style={S.h3}>Creating .vmide.json</h3>
      <p style={S.para}>
        Create a <code style={S.inlineCode}>.vmide.json</code> file on your VM. Vinexus searches for it in these locations (in order):
      </p>
      <ul style={S.list}>
        <li><code style={S.inlineCode}>{"{rootPath}"}/.vmide.json</code> — next to your project files</li>
        <li><code style={S.inlineCode}>/home/{"{username}"}/.vmide.json</code></li>
        <li><code style={S.inlineCode}>/root/.vmide.json</code></li>
      </ul>
      <p style={S.para}>Place it in your project root for the cleanest setup:</p>
      <CodeBlock lang="bash">{`# Create in your project directory
nano /home/ubuntu/myapp/.vmide.json`}</CodeBlock>

      <h3 style={S.h3}>Full .vmide.json schema</h3>
      <CodeBlock lang="json">{`{
  "version": 1,

  "project": {
    "name": "My App",
    "rootPath": "/home/ubuntu/myapp",
    "type": "node"
  },

  "services": [
    {
      "name": "My App",
      "unit": "myapp",
      "type": "pm2",
      "restartCommand": "pm2 restart myapp",
      "statusCommand": "pm2 show myapp",
      "logCommand": "pm2 logs myapp --lines 50 --nostream"
    }
  ],

  "deploy": {
    "files": [],
    "preValidate": [
      "cd /home/ubuntu/myapp && npm run lint",
      "cd /home/ubuntu/myapp && npm test -- --passWithNoTests"
    ],
    "preDeployHooks": [
      "cd /home/ubuntu/myapp && git pull origin main",
      "cd /home/ubuntu/myapp && npm install --production",
      "cd /home/ubuntu/myapp && npm run build"
    ],
    "postDeployHooks": [
      "pm2 save"
    ],
    "autoRollbackOnFailure": true
  },

  "commands": [
    {
      "name": "View Logs",
      "command": "pm2 logs myapp --lines 100 --nostream",
      "dangerLevel": "safe",
      "requiresConfirmation": false
    },
    {
      "name": "Clear Cache",
      "command": "rm -rf /home/ubuntu/myapp/.cache",
      "dangerLevel": "moderate",
      "requiresConfirmation": true
    }
  ]
}`}</CodeBlock>

      <h3 style={S.h3}>project</h3>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px 16px", marginBottom: 20, fontSize: 13 }}>
        {[
          ["name",     "Display name shown in the Deploy panel header."],
          ["rootPath", "Absolute path to your project on the VM. Used as the working directory for deploy hooks."],
          ["type",     "One of: node, python, nginx, generic. Informational — affects log display hints."],
        ].map(([k, v]) => (
          <React.Fragment key={k}>
            <code style={S.inlineCode}>{k}</code>
            <span style={{ color: D.onSurfaceVariant, lineHeight: 1.6 }}>{v}</span>
          </React.Fragment>
        ))}
      </div>

      <h3 style={S.h3}>services</h3>
      <p style={S.para}>Each entry in the <code style={S.inlineCode}>services</code> array describes a process Vinexus can restart and monitor. Supported <code style={S.inlineCode}>type</code> values:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {([
          ["pm2",     "Node.js apps managed by PM2.",                        "pm2 restart myapp",              "pm2 logs myapp --lines 50 --nostream"],
          ["systemd", "Any systemd service (nginx, gunicorn, etc.).",        "systemctl restart myapp",        "journalctl -u myapp -n 50 --no-pager"],
          ["docker",  "Docker containers.",                                  "docker restart myapp",           "docker logs --tail=50 myapp"],
          ["custom",  "Anything else — provide your own restart command.",   "supervisorctl restart myapp",    "tail -n 50 /var/log/myapp.log"],
        ] as [string,string,string,string][]).map(([type, desc, restart, log]) => (
          <div key={type} style={{ padding: "12px 14px", background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`, borderRadius: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <code style={{ ...S.inlineCode, fontSize: 11 }}>{type}</code>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>{desc}</span>
            </div>
            <div style={{ fontSize: 12, color: D.onSurfaceVariant, lineHeight: 1.8 }}>
              <span style={{ color: D.onSurface, fontWeight: 500 }}>restartCommand: </span>
              <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{restart}</code>
            </div>
            <div style={{ fontSize: 12, color: D.onSurfaceVariant, lineHeight: 1.8 }}>
              <span style={{ color: D.onSurface, fontWeight: 500 }}>logCommand: </span>
              <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{log}</code>
            </div>
          </div>
        ))}
      </div>

      <h3 style={S.h3}>deploy hooks</h3>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px 16px", marginBottom: 20, fontSize: 13 }}>
        {[
          ["preValidate",          "Commands that must pass before deployment starts. Use for linting, type-checking, and tests. Any non-zero exit code aborts the deploy."],
          ["preDeployHooks",       "Commands that run after validation but before the service is restarted. Typically: git pull, npm install, npm run build."],
          ["postDeployHooks",      "Commands that run after the service is restarted successfully. Useful for cache clearing, saving process list state (pm2 save), etc."],
          ["autoRollbackOnFailure","Set to true to automatically restore the backup if any pipeline step fails. Recommended for production environments."],
          ["files",                "List of file paths to explicitly save to the VM before deployment. Usually left empty — Vinexus saves open editor files automatically."],
        ].map(([k, v]) => (
          <React.Fragment key={k}>
            <code style={S.inlineCode}>{k}</code>
            <span style={{ color: D.onSurfaceVariant, lineHeight: 1.6 }}>{v}</span>
          </React.Fragment>
        ))}
      </div>

      <h3 style={S.h3}>Example: Node.js app with PM2</h3>
      <CodeBlock lang="json">{`{
  "version": 1,
  "project": { "name": "API Server", "rootPath": "/home/ubuntu/api", "type": "node" },
  "services": [{
    "name": "API",
    "unit": "api",
    "type": "pm2",
    "restartCommand": "pm2 restart api",
    "statusCommand": "pm2 show api",
    "logCommand": "pm2 logs api --lines 50 --nostream"
  }],
  "deploy": {
    "files": [],
    "preValidate": ["cd /home/ubuntu/api && npm run lint"],
    "preDeployHooks": [
      "cd /home/ubuntu/api && git pull origin main",
      "cd /home/ubuntu/api && npm install --production",
      "cd /home/ubuntu/api && npm run build"
    ],
    "postDeployHooks": ["pm2 save"],
    "autoRollbackOnFailure": true
  },
  "commands": []
}`}</CodeBlock>

      <h3 style={S.h3}>Example: Python app with systemd</h3>
      <CodeBlock lang="json">{`{
  "version": 1,
  "project": { "name": "Flask API", "rootPath": "/home/ubuntu/flask-api", "type": "python" },
  "services": [{
    "name": "Flask API",
    "unit": "flask-api",
    "type": "systemd",
    "restartCommand": "systemctl restart flask-api",
    "statusCommand": "systemctl status flask-api",
    "logCommand": "journalctl -u flask-api -n 50 --no-pager"
  }],
  "deploy": {
    "files": [],
    "preValidate": ["cd /home/ubuntu/flask-api && python -m pytest tests/ -q"],
    "preDeployHooks": [
      "cd /home/ubuntu/flask-api && git pull origin main",
      "cd /home/ubuntu/flask-api && pip install -r requirements.txt --quiet"
    ],
    "postDeployHooks": [],
    "autoRollbackOnFailure": true
  },
  "commands": []
}`}</CodeBlock>

      <h3 style={S.h3}>Example: Nginx static site</h3>
      <CodeBlock lang="json">{`{
  "version": 1,
  "project": { "name": "Website", "rootPath": "/var/www/html", "type": "nginx" },
  "services": [{
    "name": "Nginx",
    "unit": "nginx",
    "type": "systemd",
    "restartCommand": "nginx -t && systemctl reload nginx",
    "statusCommand": "systemctl status nginx",
    "logCommand": "tail -n 50 /var/log/nginx/error.log"
  }],
  "deploy": {
    "files": [],
    "preValidate": ["nginx -t"],
    "preDeployHooks": ["cd /var/www/html && git pull origin main"],
    "postDeployHooks": [],
    "autoRollbackOnFailure": false
  },
  "commands": []
}`}</CodeBlock>

      <h3 style={S.h3}>Using the Deploy Panel</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Create a <code style={S.inlineCode}>.vmide.json</code> on your VM (see examples above).</li>
        <li>In Vinexus, click the <strong style={S.strong}>Deploy</strong> tab in the bottom panel. If the config is detected, you will see a <strong style={S.strong}>Deploy Now</strong> button.</li>
        <li>Click <strong style={S.strong}>Deploy Now</strong>. The pipeline steps appear in real time as they run.</li>
        <li>Each step shows a green check on success or a red X with the error output on failure.</li>
        <li>If a deploy fails, click <strong style={S.strong}>Rollback</strong> to restore the previous state. If <code style={S.inlineCode}>autoRollbackOnFailure</code> is enabled, this happens automatically.</li>
        <li>Click <strong style={S.strong}>Clear</strong> to dismiss the result and return to the idle state.</li>
      </ol>

      <Info>
        If the Deploy panel shows &quot;No .vmide.json found&quot;, create the config file on your VM and reconnect (or wait up to 30 seconds for the cache to refresh). Vinexus caches the config for 30 seconds after the first load.
      </Info>

      <h3 style={S.h3}>Viewing Service Logs</h3>
      <p style={S.para}>After a deploy, Vinexus automatically pulls the first lines from your <code style={S.inlineCode}>logCommand</code>. You can also view live logs at any time from the terminal:</p>
      <CodeBlock lang="bash">{`# PM2 live logs
pm2 logs myapp

# systemd live logs
journalctl -u myapp -f

# Docker live logs
docker logs -f myapp`}</CodeBlock>
    </>
  );
}

function Troubleshooting() {
  const { D } = useTheme();
  const S = makeS(D);
  return (
    <>
      <h3 style={S.h3}>SSH Connection Issues</h3>
      <ul style={S.list}>
        <li>Is your VM running? Check the cloud provider console.</li>
        <li>Is the IP address correct? VMs get new IPs when stopped and restarted on some providers.</li>
        <li>Is SSH running on the VM? <code style={S.inlineCode}>sudo systemctl status ssh</code></li>
        <li>Does your firewall allow port 22 from your current IP? Run <code style={S.inlineCode}>curl ifconfig.me</code> and compare to your firewall rules.</li>
        <li>For key auth: check permissions with <code style={S.inlineCode}>ls -la ~/.ssh/</code> — private keys must be 600, the .ssh directory must be 700.</li>
      </ul>

      <h3 style={S.h3}>App Not Opening on macOS (Gatekeeper)</h3>
      <ol style={{ ...S.list, paddingLeft: 26 }}>
        <li>Right-click Vinexus in Applications → Open</li>
        <li>Or: System Settings → Privacy &amp; Security → Open Anyway</li>
        <li>Or: <code style={S.inlineCode}>xattr -dr com.apple.quarantine /Applications/Vinexus.app</code></li>
      </ol>

      <h3 style={S.h3}>Linux: App won&apos;t start</h3>
      <ul style={S.list}>
        <li>Ensure the AppImage is executable: <code style={S.inlineCode}>chmod +x Vinexus.AppImage</code></li>
        <li>Install missing libraries: <code style={S.inlineCode}>sudo apt-get install libgtk-3-0 libnss3 libxss1</code></li>
        <li>Run from terminal to see error output: <code style={S.inlineCode}>./Vinexus.AppImage --no-sandbox</code></li>
      </ul>

      <h3 style={S.h3}>Terminal Not Responding</h3>
      <p style={S.para}>
        If the terminal stops responding, the SSH session may have timed out. Click the reconnect button or open a new terminal tab. Add a keepalive to your SSH config to prevent this.
      </p>

      <h3 style={S.h3}>Editor Not Saving</h3>
      <ul style={S.list}>
        <li>File permissions on the server — you need write access to the file</li>
        <li>Disk space on the VM: <code style={S.inlineCode}>df -h</code></li>
        <li>Whether the SSH connection is still active (check the terminal)</li>
      </ul>

      <Info>
        If you continue to have issues, reach out at <a href="mailto:support@vinexus.dev" style={S.link}>support@vinexus.dev</a>. Include your OS version, Vinexus version, and the full error message.
      </Info>
    </>
  );
}

// ── Section renderer map ──────────────────────────────────────────
const RENDERERS: Record<SectionId, () => React.ReactElement> = {
  "getting-started":    GettingStarted,
  "install-macos":      InstallMacOS,
  "install-windows":    InstallWindows,
  "install-linux":      InstallLinux,
  "setup-vm":           SetupVM,
  "ip-whitelisting":    IPWhitelisting,
  "connecting":         Connecting,
  "claude-integration": ClaudeIntegration,
  "editor":             EditorFeatures,
  "terminal":           Terminal,
  "server-deploy":      ServerDeploy,
  "troubleshooting":    Troubleshooting,
};

const SECTION_TITLES: Record<SectionId, string> = {
  "getting-started":    "Getting Started",
  "install-macos":      "Installing on macOS",
  "install-windows":    "Installing on Windows",
  "install-linux":      "Installing on Linux",
  "setup-vm":           "Setting Up Your Cloud VM",
  "ip-whitelisting":    "IP Whitelisting",
  "connecting":         "Connecting to Your VM",
  "claude-integration": "Claude Code Integration",
  "editor":             "Editor Features",
  "terminal":           "Terminal",
  "server-deploy":      "Server Management & Deploy",
  "troubleshooting":    "Troubleshooting",
};

// ── Page ──────────────────────────────────────────────────────────
export default function DocsPage() {
  const { D } = useTheme();
  const [activeSection, setActiveSection] = useState<SectionId>("getting-started");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: D.surface, color: D.onSurface, minHeight: "100vh" }}>

      {/* Page header */}
      <div style={{
        borderBottom: `1px solid ${D.outlineVariant}`,
        padding: "48px 24px 40px",
        background: D.surfaceContainerLow,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 12 }}>Documentation</p>
          <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Vinexus Docs
          </h1>
          <p style={{ fontSize: 15, color: D.onSurfaceVariant, margin: 0, maxWidth: 520, lineHeight: 1.65 }}>
            Learn how to install Vinexus, connect to your VMs, set up Claude Code, and get the most out of every feature.
          </p>
        </div>
      </div>

      {/* Content: sidebar + main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px", display: "flex", gap: 48 }}>

        {/* Sidebar */}
        <nav style={{
          width: 220,
          flexShrink: 0,
          padding: "32px 0",
          position: "sticky",
          top: 52,
          height: "fit-content",
          maxHeight: "calc(100vh - 72px)",
          overflowY: "auto",
          background: D.surfaceContainerLow,
          borderRight: `1px solid ${D.outlineVariant}`,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 12px" }}>
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{
                    display: "block",
                    padding: "7px 12px",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? D.primary : D.onSurfaceVariant,
                    background: isActive ? D.surfaceContainerHigh : "transparent",
                    borderLeft: isActive ? `2px solid ${D.primary}` : "2px solid transparent",
                    textDecoration: "none",
                    borderRadius: "0 4px 4px 0",
                    transition: "background 0.1s",
                  }}
                >
                  {s.label}
                </a>
              );
            })}
          </div>

          {/* Quick links */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${D.outlineVariant}`, padding: "20px 24px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: D.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Quick Links</div>
            <Link href="/pricing" style={{ display: "block", fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none", padding: "4px 0" }}>Pricing</Link>
            <Link href="/download" style={{ display: "block", fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none", padding: "4px 0" }}>Download</Link>
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none", padding: "4px 0" }}>Anthropic Console ↗</a>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, padding: "40px 0 0 32px" }}>
          {SECTIONS.map((s) => {
            const Renderer = RENDERERS[s.id];
            return (
              <section key={s.id} id={s.id} style={{ marginBottom: 72, scrollMarginTop: 24 }}>
                <h2 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: D.inverseSurface,
                  letterSpacing: "-0.03em",
                  margin: "0 0 20px",
                  paddingBottom: 14,
                  borderBottom: `1px solid ${D.outlineVariant}`,
                }}>
                  {SECTION_TITLES[s.id]}
                </h2>
                {Renderer && <Renderer />}
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
