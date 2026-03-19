# Vela Desktop — Setup Guide

Vela is an IDE for managing and editing code on virtual machines, packaged as a cross-platform desktop app with Electron.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Running in Development](#running-in-development)
3. [Building Installers](#building-installers)
4. [Configuring VM Connections](#configuring-vm-connections)
5. [Authentication](#authentication)
6. [Architecture Overview](#architecture-overview)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **PostgreSQL** 14 or later (for the database)
- Python 3.x (required to build native modules)
- On macOS: Xcode Command Line Tools (`xcode-select --install`)
- On Windows: Visual Studio Build Tools with "Desktop development with C++"
- On Linux: `build-essential`, `libssl-dev`

---

## Running in Development

### 1. Install dependencies (root workspace)

```bash
cd vm-ide
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Set up environment variables

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local:
#   DATABASE_URL=postgresql://user:password@localhost:5432/vela
#   NEXTAUTH_URL=http://localhost:3000
#   NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
#   GITHUB_CLIENT_ID=<your GitHub OAuth app client ID>
#   GITHUB_CLIENT_SECRET=<your GitHub OAuth app client secret>

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env (defaults work for local dev)
```

### 5. Set up the database

```bash
# From the project root (vm-ide/)
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations
npm run db:seed       # optional: seed with test data
```

### 6. Rebuild native modules for Electron

After installing `node-pty`, rebuild it for the installed Electron version:

```bash
cd vm-ide
npm run rebuild-native
```

### 7. Start the desktop app

```bash
npm run electron:dev
```

This command (via `concurrently`) starts:
- **Next.js dev server** on `http://localhost:3000`
- **Express backend** on `http://localhost:4000`
- **Electron** (waits for both servers to be ready, then opens the window)

> **Note**: First startup may take 20–30 seconds while Next.js compiles.

---

## Building Installers

### Build for current platform

```bash
npm run electron:build
```

Outputs to `dist-electron/`.

### Build for specific platforms

```bash
npm run electron:build:mac    # .dmg + .zip (Intel + Apple Silicon)
npm run electron:build:win    # .exe NSIS installer + portable
npm run electron:build:linux  # .AppImage + .deb
```

### What the build does

1. Builds Next.js in standalone mode (`frontend/.next/standalone/`)
2. Compiles the Express TypeScript backend (`backend/dist/`)
3. Packages everything with electron-builder into `dist-electron/`

### App icons

Place your icon files in `electron/assets/`:

| File | Platform | Size |
|------|----------|------|
| `icon.icns` | macOS | 512×512 (multi-resolution) |
| `icon.ico` | Windows | multi-resolution ICO |
| `icon.png` | Linux | 512×512 PNG |

> Placeholder icons are provided. Use tools like [electron-icon-maker](https://github.com/jaretburkett/electron-icon-maker) or [Sketch/Figma exports](https://www.figma.com) to create production icons.

### Auto-updater

Vela uses `electron-updater` publishing to GitHub Releases.

1. Edit `electron-builder.yml`:
   ```yaml
   publish:
     provider: github
     owner: your-github-org
     repo: vela
   ```
2. Create a GitHub Personal Access Token with `repo` scope
3. Set `GH_TOKEN=<your token>` in your CI environment
4. Tag a release (`git tag v1.0.1`) and push — CI builds and publishes automatically

---

## Configuring VM Connections

### SSH Bar (Desktop)

The **SSH Bar** sits at the top of the IDE, directly below the native menu bar. It is always visible.

**To connect to a new VM:**

1. Click **+ New Connection** in the SSH bar
2. Fill in:
   - **Host / IP**: your VM's public IP or hostname
   - **Port**: SSH port (default: 22)
   - **Username**: SSH username (e.g., `ubuntu`, `ec2-user`)
   - **Auth Method**: Password, Private Key, or AWS SSM
   - **Credential**: password or paste PEM private key
   - **Label**: optional friendly name (e.g., `prod-server`)
3. Click **Connect** — the status dot animates yellow (connecting) then turns green (connected)

**Switching VMs:**

Click any VM badge in the SSH bar. The file tree and terminal update to show that VM's context.

**Right-click menu on a VM badge:**

- **Open Terminal** — switch to terminal tab for this VM
- **Rename** — set a friendly label
- **Copy IP** — copies the host to clipboard
- **Disconnect** — closes the SSH connection

**Saved credentials:**

VM connection credentials are encrypted and saved automatically in `electron-store` (AES-256). On next launch, saved VMs appear in the SSH bar. You do not need to re-enter credentials.

> **Note**: Credentials are stored locally on your machine using `electron-store` with encryption. They are never sent to any server.

### Web Version

When running in a browser (not Electron), use the **Connect Form** overlay that appears when you're not connected. It supports:
- Password auth
- SSH private key (paste PEM)

---

## Authentication

### Desktop (Electron)

1. **On first launch**: you see the full-screen login page inside the Electron window
2. **Sign in** with email + password, or click GitHub/Google OAuth
3. **OAuth flow**: your system browser opens for OAuth; on success it redirects to `vela://auth/callback` which the app handles
4. **Token storage**: the session token is stored in `electron-store` (encrypted)
5. **On subsequent launches**: token is loaded automatically, you go straight to the IDE

### Web (Browser)

Standard NextAuth.js session cookies — works exactly as before.

### Clearing auth / logging out

The **Disconnect** button in the title bar clears both the SSH session and (in Electron) the stored auth token.

### OAuth App Configuration

For GitHub OAuth to work in the desktop app, your GitHub OAuth app needs:
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

For production desktop builds, also register the deep link:
- **Authorization callback URL**: `vela://auth/callback`

---

## Architecture Overview

```
vm-ide/
├── electron/           ← Electron main process
│   ├── main.js         ← BrowserWindow, child process management, single-instance
│   ├── preload.js      ← contextBridge (window.electronAPI)
│   ├── menu.js         ← Native app menu (File, Edit, View, Terminal, VM, Help)
│   ├── ipc/
│   │   ├── auth.js     ← Token/credential storage (electron-store, encrypted)
│   │   ├── ssh.js      ← SSH session pool (ssh2 library)
│   │   └── pty.js      ← Interactive terminal PTY (SSH shell streams)
│   └── assets/         ← App icons, entitlements, DMG background
├── frontend/           ← Next.js 14 web app
│   ├── app/            ← App Router pages
│   ├── components/
│   │   ├── SshBar.tsx  ← Electron SSH connection bar (always-visible top bar)
│   │   └── ...         ← Existing IDE components
│   └── lib/
│       ├── electron.ts ← Electron bridge (isElectron(), electronSsh, etc.)
│       └── ...
└── backend/            ← Express.js backend (SSH proxy for web version)
```

### How it works

1. **Development**: Electron loads `http://localhost:3000` (Next.js dev server)
2. **Production**: Electron spawns the Next.js standalone server and Express backend as child processes, then loads `http://localhost:3000`
3. **SSH in Electron**: goes directly through `electron/ipc/ssh.js` using the `ssh2` library (no backend proxy needed — faster, more secure)
4. **SSH in browser**: proxied through the Express backend via REST + WebSocket

### Security

- `nodeIntegration: false`, `contextIsolation: true` — renderer cannot access Node.js directly
- All SSH/file operations run in the Electron main process
- Credentials stored AES-256 encrypted via `electron-store`
- No credentials ever sent to external servers
- SSH target validation (blocks private IP ranges in web mode)

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` for dev |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte secret |
| `GITHUB_CLIENT_ID` | For OAuth | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | For OAuth | GitHub OAuth app client secret |
| `STRIPE_SECRET_KEY` | For billing | Stripe API key |
| `RESEND_API_KEY` | For email | Resend API key |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` |

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Express server port |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `SESSION_TIMEOUT_MINUTES` | `30` | SSH session idle timeout |
| `MAX_FILE_SIZE` | `2097152` | Max SFTP file size (bytes) |

### AWS (optional, for EC2 features)

Set in your shell or system environment (not in `.env` files):

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret |
| `AWS_DEFAULT_REGION` | Default AWS region (e.g., `us-east-1`) |

---

## Troubleshooting

### App won't start / blank window

- Make sure ports 3000 and 4000 are free: `lsof -i :3000 -i :4000`
- Run `npm run frontend:dev` and `npm run backend:dev` in separate terminals first, verify they start before trying Electron

### `node-pty` build errors

```bash
npm run rebuild-native
# or
npx electron-rebuild -f -w node-pty
```

### SSH connection fails

- Verify the VM allows SSH from your IP (check security groups)
- Test with `ssh username@host -p port` in terminal first
- Check `electron-log` output: `~/.config/Vela/logs/main.log` (Linux), `~/Library/Logs/Vela/main.log` (macOS)

### Database errors

```bash
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:push       # push schema without migration (dev only)
```

### OAuth deep links not working (macOS)

Register the app as the `vela://` protocol handler by building and installing the app:
```bash
npm run electron:build:mac
open dist-electron/Vela-*.dmg
```
Then drag Vela.app to Applications.

### Build fails: icon files missing

The placeholder `icon.png` is included. For `.icns` and `.ico`, generate them:
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=electron/assets/icon.png --output=electron/assets
```
