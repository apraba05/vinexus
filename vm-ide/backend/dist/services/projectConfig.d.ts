import { ProjectConfig } from "../types";
export declare class ProjectConfigService {
    /**
     * Load .vmide.json from the remote VM.
     * Falls back to default config if the file doesn't exist.
     */
    load(sessionId: string, rootPath?: string): Promise<ProjectConfig>;
    /**
     * Invalidate the cached config for a session.
     */
    invalidate(sessionId: string): void;
    /**
     * Validate and fill defaults for a raw config object.
     */
    private validate;
}
export declare const projectConfigService: ProjectConfigService;
//# sourceMappingURL=projectConfig.d.ts.map