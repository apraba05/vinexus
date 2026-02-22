import { getSession } from "../sessionStore";
import { ProjectConfig, sftpReadFile } from "../types";

const DEFAULT_CONFIG: ProjectConfig = {
  version: 1,
  project: {
    name: "Untitled",
    rootPath: "/home",
    type: "generic",
  },
  services: [],
  deploy: {
    files: [],
    preValidate: [],
    preDeployHooks: [],
    postDeployHooks: [],
    autoRollbackOnFailure: false,
  },
  commands: [],
};

// Per-session config cache: sessionId -> { config, loadedAt }
const configCache = new Map<
  string,
  { config: ProjectConfig; loadedAt: number }
>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export class ProjectConfigService {
  /**
   * Load .vmide.json from the remote VM.
   * Falls back to default config if the file doesn't exist.
   */
  async load(sessionId: string, rootPath?: string): Promise<ProjectConfig> {
    // Check cache
    const cached = configCache.get(sessionId);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return cached.config;
    }

    const session = getSession(sessionId);
    if (!session) throw new Error("Session not found or expired");

    const searchPaths = rootPath
      ? [`${rootPath}/.vmide.json`]
      : [
          "/home/.vmide.json",
          `/home/${session.username}/.vmide.json`,
          "/root/.vmide.json",
        ];

    for (const configPath of searchPaths) {
      try {
        const buf = await sftpReadFile(session.sftp, configPath);
        const raw = JSON.parse(buf.toString("utf-8"));
        const config = this.validate(raw);

        configCache.set(sessionId, { config, loadedAt: Date.now() });
        return config;
      } catch {
        // File doesn't exist or is invalid — try next path
      }
    }

    // No config found — return defaults
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Invalidate the cached config for a session.
   */
  invalidate(sessionId: string): void {
    configCache.delete(sessionId);
  }

  /**
   * Validate and fill defaults for a raw config object.
   */
  private validate(raw: any): ProjectConfig {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid config: not an object");
    }

    return {
      version: raw.version || 1,
      project: {
        name: raw.project?.name || "Untitled",
        rootPath: raw.project?.rootPath || "/home",
        type: raw.project?.type || "generic",
      },
      services: Array.isArray(raw.services)
        ? raw.services.map((s: any) => ({
            name: s.name || "Unknown",
            unit: s.unit || "",
            type: s.type || "systemd",
            restartCommand: s.restartCommand,
            statusCommand: s.statusCommand,
            logCommand: s.logCommand,
          }))
        : [],
      deploy: {
        files: Array.isArray(raw.deploy?.files) ? raw.deploy.files : [],
        preValidate: Array.isArray(raw.deploy?.preValidate)
          ? raw.deploy.preValidate
          : [],
        preDeployHooks: Array.isArray(raw.deploy?.preDeployHooks)
          ? raw.deploy.preDeployHooks
          : [],
        postDeployHooks: Array.isArray(raw.deploy?.postDeployHooks)
          ? raw.deploy.postDeployHooks
          : [],
        autoRollbackOnFailure: raw.deploy?.autoRollbackOnFailure ?? false,
      },
      commands: Array.isArray(raw.commands)
        ? raw.commands.map((c: any) => ({
            name: c.name || "Custom",
            command: c.command || "",
            icon: c.icon,
            dangerLevel: c.dangerLevel || "moderate",
            requiresConfirmation: c.requiresConfirmation ?? true,
          }))
        : [],
    };
  }
}

export const projectConfigService = new ProjectConfigService();
