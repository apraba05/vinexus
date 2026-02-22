# VM-IDE: Browser-Based VS Code for Your VM

> **WARNING: This is an MVP — NOT production safe.**
> See [Security Notes](#security-notes) below.

A web app that connects to a Linux VM over SSH and provides:
- File browsing (tree explorer)
- Monaco code editor with tabs
- File create/delete/rename/move
- Interactive terminal (xterm.js over WebSockets)
- Password and private key SSH authentication

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Linux VM with SSH enabled (password or key auth)

### 1. Clone & Install

```bash
cd vm-ide

# Install backend dependencies
cd backend
cp .env.example .env
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Run Both Servers

From the `vm-ide` directory:

```bash
# Terminal 1: Backend (port 4000)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend && npm run dev
```

Or use the convenience script:

```bash
chmod +x run.sh
./run.sh
```

### 3. Open Browser

Go to [http://localhost:3000](http://localhost:3000)

### 4. Connect to Your VM

1. Enter your VM's IP/hostname, port (default 22), and username
2. Choose "Password" or "Private Key" auth
3. Enter credentials and click **Connect**
4. Browse files in the left panel, edit in center, use terminal at bottom

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
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS origin |

## Security Notes

**This MVP is NOT production safe. Do NOT deploy to the public internet.**

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

## Testing Checklist

- [ ] Connect to VM with password auth
- [ ] Connect to VM with private key auth
- [ ] Browse directories in file tree
- [ ] Open a file (click in tree)
- [ ] Edit file content in Monaco editor
- [ ] Save file (Ctrl+S or Save button) — verify on VM
- [ ] Create a new file
- [ ] Create a new folder
- [ ] Rename a file/folder
- [ ] Delete a file/folder
- [ ] Terminal: type commands, see output
- [ ] Terminal: resize by dragging the handle
- [ ] Reconnect after page refresh (session persists in localStorage)
- [ ] Disconnect and reconnect
- [ ] Error toast on failed operations
