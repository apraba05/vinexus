"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectConfigService = exports.ProjectConfigService = void 0;
const sessionStore_1 = require("../sessionStore");
const types_1 = require("../types");
const DEFAULT_CONFIG = {
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
const configCache = new Map();
const CACHE_TTL_MS = 30_000; // 30 seconds
class ProjectConfigService {
    /**
     * Load .vmide.json from the remote VM.
     * Falls back to default config if the file doesn't exist.
     */
    async load(sessionId, rootPath) {
        // Check cache
        const cached = configCache.get(sessionId);
        if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
            return cached.config;
        }
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        const searchPaths = rootPath
            ? [`${rootPath}/.vmide.json`]
            : [
                "/home/.vmide.json",
                `/home/${session.username}/.vmide.json`,
                "/root/.vmide.json",
            ];
        for (const configPath of searchPaths) {
            try {
                const buf = await (0, types_1.sftpReadFile)(session.sftp, configPath);
                const raw = JSON.parse(buf.toString("utf-8"));
                const config = this.validate(raw);
                configCache.set(sessionId, { config, loadedAt: Date.now() });
                return config;
            }
            catch {
                // File doesn't exist or is invalid — try next path
            }
        }
        // No config found — return defaults
        return { ...DEFAULT_CONFIG };
    }
    /**
     * Invalidate the cached config for a session.
     */
    invalidate(sessionId) {
        configCache.delete(sessionId);
    }
    /**
     * Validate and fill defaults for a raw config object.
     */
    validate(raw) {
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
                ? raw.services.map((s) => ({
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
                ? raw.commands.map((c) => ({
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
exports.ProjectConfigService = ProjectConfigService;
exports.projectConfigService = new ProjectConfigService();
//# sourceMappingURL=projectConfig.js.map