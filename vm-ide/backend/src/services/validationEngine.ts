import { sshExecutor } from "./sshExecutor";
import { ValidationResult, ValidationReport } from "../types";
import path from "path";

interface Validator {
  id: string;
  name: string;
  filePatterns: RegExp[];
  validate: (sessionId: string, filePath: string) => Promise<ValidationResult>;
}

const validators: Validator[] = [
  {
    id: "nginx-syntax",
    name: "Nginx Syntax Check",
    filePatterns: [/nginx/i, /\.conf$/],
    validate: async (sessionId, _filePath) => {
      const result = await sshExecutor.exec({
        sessionId,
        command: "nginx -t",
        sudo: true,
        timeout: 10_000,
      });
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0
          ? [(result.stderr || result.stdout).trim()]
          : [],
      };
    },
  },
  {
    id: "python-compile",
    name: "Python Syntax Check",
    filePatterns: [/\.py$/],
    validate: async (sessionId, filePath) => {
      const result = await sshExecutor.exec({
        sessionId,
        command: `python3 -m py_compile "${filePath}"`,
        timeout: 10_000,
      });
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0
          ? [(result.stderr || result.stdout).trim()]
          : [],
      };
    },
  },
  {
    id: "node-check",
    name: "Node.js Syntax Check",
    filePatterns: [/\.js$/, /\.mjs$/],
    validate: async (sessionId, filePath) => {
      const result = await sshExecutor.exec({
        sessionId,
        command: `node --check "${filePath}"`,
        timeout: 10_000,
      });
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0
          ? [(result.stderr || result.stdout).trim()]
          : [],
      };
    },
  },
  {
    id: "json-validate",
    name: "JSON Validation",
    filePatterns: [/\.json$/],
    validate: async (sessionId, filePath) => {
      const result = await sshExecutor.exec({
        sessionId,
        command: `python3 -c "import json; json.load(open('${filePath}'))"`,
        timeout: 10_000,
      });
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0
          ? [(result.stderr || result.stdout).trim()]
          : [],
      };
    },
  },
  {
    id: "yaml-validate",
    name: "YAML Validation",
    filePatterns: [/\.ya?ml$/],
    validate: async (sessionId, filePath) => {
      const result = await sshExecutor.exec({
        sessionId,
        command: `python3 -c "import yaml; yaml.safe_load(open('${filePath}'))"`,
        timeout: 10_000,
      });
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0
          ? [(result.stderr || result.stdout).trim()]
          : [],
      };
    },
  },
];

export class ValidationEngine {
  /**
   * Auto-detect and run all matching validators for a file.
   */
  async validateFile(
    sessionId: string,
    filePath: string
  ): Promise<ValidationReport> {
    const matching = validators.filter((v) =>
      v.filePatterns.some((p) => p.test(filePath))
    );

    const results: ValidationReport["results"] = [];

    for (const validator of matching) {
      const start = Date.now();
      try {
        const result = await validator.validate(sessionId, filePath);
        results.push({
          validatorId: validator.id,
          validatorName: validator.name,
          result,
          durationMs: Date.now() - start,
        });
      } catch (err: any) {
        results.push({
          validatorId: validator.id,
          validatorName: validator.name,
          result: { valid: false, errors: [err.message] },
          durationMs: Date.now() - start,
        });
      }
    }

    return {
      filePath,
      results,
      overallValid: results.length === 0 || results.every((r) => r.result.valid),
    };
  }

  /**
   * Validate multiple files. Returns reports for files that have matching validators.
   */
  async validateFiles(
    sessionId: string,
    filePaths: string[]
  ): Promise<ValidationReport[]> {
    const reports: ValidationReport[] = [];
    for (const fp of filePaths) {
      const report = await this.validateFile(sessionId, fp);
      if (report.results.length > 0) {
        reports.push(report);
      }
    }
    return reports;
  }

  /**
   * List available validators and which files they match.
   */
  getValidators(): Array<{ id: string; name: string; patterns: string[] }> {
    return validators.map((v) => ({
      id: v.id,
      name: v.name,
      patterns: v.filePatterns.map((p) => p.source),
    }));
  }
}

export const validationEngine = new ValidationEngine();
