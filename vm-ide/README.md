# Vinexus Workspace

This repository currently has two user-facing entrypoints:
- Web app: Next.js UI in `frontend/` backed by the Express API in `backend/`
- Desktop app: Electron shell in `electron/` that hosts the same UI and desktop-only SSH features

The active source of truth is:
- UI: `frontend/`
- API and WebSockets: `backend/`
- Desktop shell: `electron/`

The old duplicate Electron wrapper has been archived out of the main path so there is one desktop implementation to reason about.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Linux VM with SSH enabled if you want to test remote editing

### Structure

```text
vm-ide/
├── frontend/   # Next.js UI
├── backend/    # Express API + WebSocket services
├── electron/   # Electron main/preload/ipc for the desktop app
└── docs/       # Supporting docs
```

### 1. Clone & Install

```bash
cd vm-ide
npm install
```

### 2. Run the Web App

From the `vm-ide` directory:

```bash
npm run api:dev
npm run web:dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run the Desktop App

```bash
npm run desktop:dev
```

This starts:
- Next.js on port `3000`
- Express on port `4000`
- Electron after both are ready

If the web servers are already running, you can just open the desktop shell:

```bash
npm run desktop:open
```

### 4. Connect to Your VM

1. Enter your VM's IP/hostname, port (default 22), and username
2. Choose "Password" or "Private Key" auth
3. Enter credentials and click **Connect**
4. Browse files, edit code, and use the integrated terminal

### VM Setup Requirements

Your target Linux VM needs:
- **SSH server running** (`sudo systemctl start sshd`)
- **Password auth enabled** (in `/etc/ssh/sshd_config`: `PasswordAuthentication yes`) OR
- **Your public key** in `~/.ssh/authorized_keys` on the VM
- **User must have permissions** to read/write the files you want to edit
- **Firewall** must allow incoming SSH connections on the configured port

## Environment Variables

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Backend server port |
| `SESSION_TIMEOUT_MINUTES` | `30` | Auto-expire idle sessions |
| `MAX_FILE_SIZE` | `2097152` | Max file size in bytes (2MB) |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

## Security Notes

**This MVP is not production safe. Do not expose it directly to the public internet.**

What needs to change for production:
- [ ] Add HTTPS/TLS termination
- [ ] Add proper authentication (OAuth, JWT, etc.)
- [ ] Never send private keys over plain HTTP
- [ ] Rate limiting on all endpoints
- [ ] Input sanitization and path traversal protection
- [ ] CSRF protection
- [ ] Session tokens should be signed/encrypted
- [ ] Audit logging
- [ ] Restrict SSH connection targets (allowlist)
- [ ] Run backend with minimal privileges
- [ ] Add helmet.js and security headers
- [ ] Consider SSH agent forwarding instead of key pasting

## Useful Commands

```bash
npm run web:dev
npm run api:dev
npm run desktop:dev
npm run desktop:open
npm run frontend:build
npm run backend:build
npm run electron:build
```
