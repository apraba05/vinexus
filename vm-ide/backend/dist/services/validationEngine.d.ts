import { ValidationReport } from "../types";
export declare class ValidationEngine {
    /**
     * Auto-detect and run all matching validators for a file.
     */
    validateFile(sessionId: string, filePath: string): Promise<ValidationReport>;
    /**
     * Validate multiple files. Returns reports for files that have matching validators.
     */
    validateFiles(sessionId: string, filePaths: string[]): Promise<ValidationReport[]>;
    /**
     * List available validators and which files they match.
     */
    getValidators(): Array<{
        id: string;
        name: string;
        patterns: string[];
    }>;
}
export declare const validationEngine: ValidationEngine;
//# sourceMappingURL=validationEngine.d.ts.map