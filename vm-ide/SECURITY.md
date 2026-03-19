# Security Policy — Vela

## Reporting a Vulnerability

If you discover a security vulnerability in Vela, please report it responsibly:

1. **Email**: security@vela.dev
2. **Do not** open a public GitHub issue for security vulnerabilities
3. Include a detailed description, reproduction steps, and impact assessment
4. Allow up to 72 hours for initial response

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active |

## Security Architecture

### Authentication & Authorization
- **NextAuth v5** with JWT strategy (encrypted JWE cookies)
- **bcryptjs** (cost factor 12) for password hashing
- Role-based access: `user`, `admin`
- Subscription-based feature gating (Free / Pro)
- GitHub OAuth integration

### API Security
- **Helmet** security headers on Express backend
- **CORS** restricted to configured frontend origin
- **Rate limiting**: 200 req/min (API), 10 req/min (AI), 10 req/min (auth/session)
- **JWT authentication** for SSH session management
- **Audit logging** (JSONL) for all API requests
- **Stripe webhook** signature verification

### Input Validation
- Path traversal protection on all file system operations
- Shell metacharacter rejection for delete/rename paths
- Protected system directory blocklist (`/`, `/etc`, `/var`, etc.)
- Command injection prevention — single-quoted shell arguments
- Dangerous command pattern blocklist for custom commands
- SSH parameter validation (host, port, username, key size)
- Email regex validation, password length limits
- File size limits (2MB default)

### Network Security
- **SSRF protection**: SSH connections to private/internal IPs are blocked
- **WebSocket origin validation** against configured frontend origin
- **WebSocket message size limit** (1MB)
- **Caddy reverse proxy** with automatic HTTPS (Let's Encrypt)
- **CSP**, **HSTS** (with preload), **X-Frame-Options DENY** headers
- Non-root Docker containers with resource limits

### Secrets Management
- All secrets via environment variables — never committed to source
- `.env.example` / `.env.production` templates with placeholders only
- Gitleaks configuration for CI secret scanning
- GitHub Actions security workflow (audit + secrets + build)

## Threat Model

### Attack Surface
1. **Web application** (Next.js frontend) — standard web app threats
2. **API server** (Express backend) — API abuse, injection
3. **SSH proxy** — the backend bridges SSH connections to user VMs
4. **WebSocket channels** — terminal, exec, logs, deploy
5. **Stripe billing** — webhook tampering

### Mitigated Threats
| Threat | Mitigation |
|--------|-----------|
| **Command Injection** (OWASP A03) | Path validation, shell escaping, cmd blocklist |
| **SSRF** (OWASP A10) | Private IP range blocklist on SSH connect |
| **XSS** (OWASP A07) | CSP headers, React auto-escaping, X-XSS-Protection |
| **Broken Auth** (OWASP A07) | bcrypt, rate limiting, JWT expiry, session management |
| **Security Misconfiguration** (OWASP A05) | Helmet, security headers, non-root containers |
| **Secrets Exposure** (OWASP A02) | Env vars only, gitleaks scanning, .gitignore |
| **Clickjacking** | X-Frame-Options: DENY |
| **CSRF** | SameSite cookies (NextAuth default), CORS |

### Accepted Risks / Remaining Items
- In-memory rate limiting (not distributed) — acceptable for single-instance deploys
- Custom command execution (`/api/commands/custom`) — gated behind Pro + confirmation
- SSH credentials are held in memory during session — cleared on disconnect/timeout
- No WAF in default deployment — recommended for production at scale
- Audit logs are file-based — swap to database for production at scale

## Security Updates

Security patches are applied to dependencies via:
- `npm audit` in CI (weekly + on PR)
- Dependabot / Renovate (recommended to enable)
- Manual review of critical CVEs
