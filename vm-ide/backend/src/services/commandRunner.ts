import { sshExecutor } from "./sshExecutor";
import {
  CommandTemplate,
  CommandResult,
  DangerLevel,
} from "../types";

// Parameter values must match this pattern — no shell metacharacters
const SAFE_PARAM_RE = /^[a-zA-Z0-9._\-/]+$/;
const MAX_COMMAND_LENGTH = 4096;

// Dangerous command patterns that should never be allowed via custom commands
const DANGEROUS_PATTERNS = [
  /rm\s+(-rf|-fr|--no-preserve-root)\s+\/\s*$/,  // rm -rf /
  /rm\s+(-rf|-fr)\s+\/[a-z]+\s*$/,                // rm -rf /etc, /var, etc.
  /mkfs\b/,                                        // filesystem formatting
  /:\(\)\{\s*:|:\s*&\s*\}\s*;\s*:/,                // fork bomb
  /dd\s+if=/,                                      // raw disk write
  />(\s*)\/dev\/[sh]d/,                             // write to raw device
  /chmod\s+(-R\s+)?777\s+\//,                      // chmod 777 /
  /chown\s+(-R\s+)?.*\s+\//,                       // chown / root dirs
  /shutdown\b|reboot\b|halt\b|poweroff\b/,         // system power
  /init\s+0/,                                      // halt system
];

const BUILTIN_COMMANDS: CommandTemplate[] = [
  {
    id: "systemd-restart",
    name: "Restart Service",
    description: "Restart a systemd service unit",
    category: "systemd",
    command: "systemctl restart {service}",
    parameters: [{ name: "service", type: "string", required: true }],
    requiresSudo: true,
    timeout: 30_000,
    dangerLevel: "moderate",
  },
  {
    id: "systemd-stop",
    name: "Stop Service",
    description: "Stop a systemd service unit",
    category: "systemd",
    command: "systemctl stop {service}",
    parameters: [{ name: "service", type: "string", required: true }],
    requiresSudo: true,
    timeout: 30_000,
    dangerLevel: "dangerous",
  },
  {
    id: "systemd-start",
    name: "Start Service",
    description: "Start a systemd service unit",
    category: "systemd",
    command: "systemctl start {service}",
    parameters: [{ name: "service", type: "string", required: true }],
    requiresSudo: true,
    timeout: 30_000,
    dangerLevel: "moderate",
  },
  {
    id: "systemd-status",
    name: "Service Status",
    description: "Check the status of a systemd service",
    category: "systemd",
    command: "systemctl status {service} --no-pager",
    parameters: [{ name: "service", type: "string", required: true }],
    requiresSudo: false,
    timeout: 10_000,
    dangerLevel: "safe",
  },
  {
    id: "systemd-daemon-reload",
    name: "Reload systemd",
    description: "Reload systemd manager configuration",
    category: "systemd",
    command: "systemctl daemon-reload",
    parameters: [],
    requiresSudo: true,
    timeout: 15_000,
    dangerLevel: "moderate",
  },
  {
    id: "nginx-test",
    name: "Test Nginx Config",
    description: "Test nginx configuration for syntax errors",
    category: "nginx",
    command: "nginx -t",
    parameters: [],
    requiresSudo: true,
    timeout: 10_000,
    dangerLevel: "safe",
  },
  {
    id: "nginx-reload",
    name: "Reload Nginx",
    description: "Reload nginx configuration without downtime",
    category: "nginx",
    command: "systemctl reload nginx",
    parameters: [],
    requiresSudo: true,
    timeout: 15_000,
    dangerLevel: "moderate",
  },
  {
    id: "journal-logs",
    name: "Service Logs",
    description: "Fetch recent logs for a systemd service",
    category: "systemd",
    command: "journalctl -u {service} --no-pager -n {lines}",
    parameters: [
      { name: "service", type: "string", required: true },
      { name: "lines", type: "number", required: false, default: 50 },
    ],
    requiresSudo: false,
    timeout: 10_000,
    dangerLevel: "safe",
  },
  {
    id: "docker-ps",
    name: "Docker Containers",
    description: "List running Docker containers",
    category: "docker",
    command: "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
    parameters: [],
    requiresSudo: false,
    timeout: 10_000,
    dangerLevel: "safe",
  },
  {
    id: "docker-restart",
    name: "Restart Container",
    description: "Restart a Docker container",
    category: "docker",
    command: "docker restart {container}",
    parameters: [{ name: "container", type: "string", required: true }],
    requiresSudo: false,
    timeout: 30_000,
    dangerLevel: "moderate",
  },
];

export class CommandRunner {
  private templates: Map<string, CommandTemplate>;

  constructor() {
    this.templates = new Map();
    for (const tpl of BUILTIN_COMMANDS) {
      this.templates.set(tpl.id, tpl);
    }
  }

  /**
   * Get all available command templates.
   */
  getTemplates(): CommandTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get a specific template by ID.
   */
  getTemplate(id: string): CommandTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Register a custom command template (from .vmide.json).
   */
  registerTemplate(template: CommandTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Execute a predefined command template with validated parameters.
   */
  async runTemplate(
    sessionId: string,
    templateId: string,
    params: Record<string, string | number>
  ): Promise<CommandResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Unknown command template: ${templateId}`);
    }

    // Validate and fill parameters
    const resolvedParams: Record<string, string> = {};
    for (const pDef of template.parameters) {
      const value = params[pDef.name];
      if (value === undefined || value === "") {
        if (pDef.required) {
          throw new Error(`Missing required parameter: ${pDef.name}`);
        }
        if (pDef.default !== undefined) {
          resolvedParams[pDef.name] = String(pDef.default);
        }
        continue;
      }

      const strValue = String(value);

      // Validate parameter safety
      if (!SAFE_PARAM_RE.test(strValue)) {
        throw new Error(
          `Invalid parameter value for '${pDef.name}': contains disallowed characters`
        );
      }

      resolvedParams[pDef.name] = strValue;
    }

    // Build command from template
    const command = this.interpolateCommand(template.command, resolvedParams);

    const result = await sshExecutor.exec({
      sessionId,
      command,
      timeout: template.timeout,
      sudo: template.requiresSudo,
    });

    return {
      templateId,
      command: (template.requiresSudo ? "sudo " : "") + command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
    };
  }

  /**
   * Execute a custom command (from .vmide.json custom commands).
   * Requires explicit confirmation flag.
   */
  async runCustom(
    sessionId: string,
    command: string,
    sudo: boolean = false,
    timeout: number = 30_000
  ): Promise<CommandResult> {
    // Security: Validate command length
    if (command.length > MAX_COMMAND_LENGTH) {
      throw new Error(`Command too long (max ${MAX_COMMAND_LENGTH} chars)`);
    }

    // Security: Check against dangerous command patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        throw new Error("Command blocked: matches a dangerous pattern");
      }
    }

    const result = await sshExecutor.exec({
      sessionId,
      command,
      timeout,
      sudo,
    });

    return {
      command: (sudo ? "sudo " : "") + command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
    };
  }

  /**
   * Replace {param} placeholders with validated values.
   */
  private interpolateCommand(
    template: string,
    params: Record<string, string>
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (key in params) {
        return params[key];
      }
      return match; // Leave unresolved placeholders as-is
    });
  }
}

export const commandRunner = new CommandRunner();
