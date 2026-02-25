# AI Developer Mode

## Overview

AI Developer Mode is an agentic coding feature that lets you describe a code change in natural language, and the system will:

1. **Plan** — Analyze the codebase, infer the stack, and produce a task checklist
2. **Edit** — Make file changes (streaming into the editor in real time)
3. **Run** — Execute commands (install deps, lint, test, build)
4. **Fix** — If a command fails, the agent reads the error, fixes the code, and retries (up to 3 times)
5. **Ship** — Persist changes to the VM (Pro users only)

## Access

| Plan | Plan Only | Live Edits | Command Execution | VM Persistence |
|------|-----------|------------|-------------------|----------------|
| Free | ✅ | ❌ | ❌ | ❌ |
| Pro  | ✅ | ✅ | ✅ | ✅ |

## Environment Variables

Add these to your `backend/.env`:

```env
# AI Model (defaults shown)
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0

# Auth (required for Pro gating)
AUTH_ENABLED=true

# Frontend origin (for CORS + WebSocket origin validation)
FRONTEND_ORIGIN=http://localhost:3000
```

## WebSocket Event Protocol

The agent uses the existing multiplexed WebSocket at `/ws/session?sessionId=X`, channel `"agent"`.

### Client → Server

| Type | Payload | Description |
|------|---------|-------------|
| `start` | `{ prompt, context, options }` | Start agent session |
| `pause` | `{}` | Pause running session |
| `resume` | `{}` | Resume paused session |
| `stop` | `{}` | Stop agent session |
| `rollback` | `{}` | Rollback all file changes |
| `plan_only` | `{ prompt, context }` | Generate plan only (free users) |

### Server → Client

| Type | Payload | Description |
|------|---------|-------------|
| `session_created` | `{ sessionId, state }` | Session created |
| `state_change` | `{ state }` | State transition |
| `plan` | `{ plan }` | Agent's proposed plan |
| `agent_text` | `{ text }` | Agent reasoning text |
| `tool_start` | `{ tool, args, toolId }` | Tool execution started |
| `tool_complete` | `{ tool, toolId, result }` | Tool succeeded |
| `tool_error` | `{ tool, toolId, error }` | Tool failed |
| `edit_delta` | `{ path, content, action }` | File edited by agent |
| `file_created` | `{ path, content }` | New file created |
| `file_deleted` | `{ path }` | File deleted |
| `cmd_start` | `{ command, cwd }` | Command started |
| `cmd_complete` | `{ command, exitCode, stdout, stderr, durationMs }` | Command finished |
| `error` | `{ error, fatal }` | Error (fatal = session ends) |
| `done` | `{ summary, success, filesChanged, toolCalls }` | Session complete |
| `rollback_complete` | `{ restoredFiles }` | Rollback finished |

## REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/agent/plan` | User | Generate plan only |
| `POST` | `/api/agent/stop` | User | Stop agent session |
| `POST` | `/api/agent/rollback` | User | Rollback changes |
| `GET` | `/api/agent/status` | User | Get session status |

## Safety Constraints

### Path Restrictions
- All file operations are restricted to the workspace root directory
- Path traversal (`../`) is blocked
- Null bytes and shell metacharacters in paths are rejected

### Command Allowlist
Only these commands can be executed by the agent:
`npm`, `npx`, `yarn`, `pnpm`, `pip`, `pip3`, `python`, `python3`, `go`, `cargo`, `make`, `cmake`, `cat`, `head`, `tail`, `wc`, `grep`, `find`, `ls`, `pwd`, `which`, `echo`, `test`, `jest`, `pytest`, `mocha`, `vitest`, `tsc`, `node`, `eslint`, `prettier`, `biome`, `git`, `mkdir`, `touch`, `cp`

### Additional Limits
- Max 30 file changes per session
- Max 512KB per file
- 60s command timeout
- Max 3 self-heal retry attempts per failure
- Max 30 AI iterations per session

### Rollback Behavior
- Before modifying any file, a backup is created in `.vmide-backups/`
- The "Rollback" action restores all backed-up files and removes agent-created files
- Rollback is available any time after the agent session completes (done, failed, or stopped)
- Each file backup uses the format `{filename}.{unix_timestamp}.bak`

### Secrets Redaction
All file contents and command outputs sent to the AI model are sanitized:
- API keys, tokens, passwords, and credentials are replaced with `[REDACTED]`
- PEM certificates are stripped
- Long base64 strings (likely keys) are removed

### Audit Logging
Every agent tool call is recorded with:
- Tool name and arguments
- Result or error
- Duration
- Session ID and SSH session ID
