import { describe, it } from "node:test";
import assert from "node:assert";
import { validateAgentPath, validateCommand, redactSecrets } from "../services/agentTools";

// ─── Path Validation Tests ───────────────────────────────────────

describe("validateAgentPath", () => {
    const workspaceRoot = "/home/user/project";

    it("should accept valid paths under workspace root", () => {
        assert.strictEqual(validateAgentPath("/home/user/project/src/index.ts", workspaceRoot), null);
        assert.strictEqual(validateAgentPath("/home/user/project/.env", workspaceRoot), null);
        assert.strictEqual(validateAgentPath("/home/user/project/nested/deep/file.js", workspaceRoot), null);
    });

    it("should reject paths outside workspace root", () => {
        assert.notStrictEqual(validateAgentPath("/etc/passwd", workspaceRoot), null);
        assert.notStrictEqual(validateAgentPath("/home/otheruser/file.txt", workspaceRoot), null);
        assert.notStrictEqual(validateAgentPath("/root/.ssh/id_rsa", workspaceRoot), null);
    });

    it("should reject path traversal attempts", () => {
        assert.notStrictEqual(validateAgentPath("/home/user/project/../../etc/passwd", workspaceRoot), null);
    });

    it("should reject relative paths", () => {
        assert.notStrictEqual(validateAgentPath("src/index.ts", workspaceRoot), null);
        assert.notStrictEqual(validateAgentPath("./file.txt", workspaceRoot), null);
    });

    it("should reject null bytes", () => {
        assert.notStrictEqual(validateAgentPath("/home/user/project/file\0.txt", workspaceRoot), null);
    });

    it("should reject empty paths", () => {
        assert.notStrictEqual(validateAgentPath("", workspaceRoot), null);
    });
});

// ─── Command Allowlist Tests ─────────────────────────────────────

describe("validateCommand", () => {
    it("should accept allowed commands", () => {
        assert.strictEqual(validateCommand("npm install"), null);
        assert.strictEqual(validateCommand("npm test"), null);
        assert.strictEqual(validateCommand("npm run build"), null);
        assert.strictEqual(validateCommand("yarn add express"), null);
        assert.strictEqual(validateCommand("pnpm install"), null);
        assert.strictEqual(validateCommand("tsc --noEmit"), null);
        assert.strictEqual(validateCommand("eslint src/"), null);
        assert.strictEqual(validateCommand("prettier --write ."), null);
        assert.strictEqual(validateCommand("jest --coverage"), null);
        assert.strictEqual(validateCommand("pytest -v"), null);
        assert.strictEqual(validateCommand("python3 manage.py migrate"), null);
        assert.strictEqual(validateCommand("go test ./..."), null);
        assert.strictEqual(validateCommand("cargo build"), null);
        assert.strictEqual(validateCommand("make build"), null);
        assert.strictEqual(validateCommand("git status"), null);
        assert.strictEqual(validateCommand("cat package.json"), null);
        assert.strictEqual(validateCommand("grep -rn TODO src/"), null);
        assert.strictEqual(validateCommand("ls -la"), null);
        assert.strictEqual(validateCommand("node script.js"), null);
    });

    it("should reject non-allowlisted commands", () => {
        assert.notStrictEqual(validateCommand("curl http://example.com"), null);
        assert.notStrictEqual(validateCommand("wget http://example.com"), null);
        assert.notStrictEqual(validateCommand("ssh user@host"), null);
        assert.notStrictEqual(validateCommand("scp file.txt user@host:/tmp"), null);
        assert.notStrictEqual(validateCommand("apt-get install vim"), null);
        assert.notStrictEqual(validateCommand("sudo anything"), null);
        assert.notStrictEqual(validateCommand("nc -l 1234"), null);
    });

    it("should reject dangerous patterns", () => {
        assert.notStrictEqual(validateCommand("rm -rf /"), null);
        assert.notStrictEqual(validateCommand("shutdown -h now"), null);
        assert.notStrictEqual(validateCommand("reboot"), null);
    });

    it("should reject empty or overly long commands", () => {
        assert.notStrictEqual(validateCommand(""), null);
        assert.notStrictEqual(validateCommand("a".repeat(5000)), null);
    });
});

// ─── Secrets Redaction Tests ─────────────────────────────────────

describe("redactSecrets", () => {
    it("should redact API keys and tokens", () => {
        const input = "API_KEY=sk_test_abc123def456 some text";
        const result = redactSecrets(input);
        assert.ok(!result.includes("sk_test_abc123def456"));
        assert.ok(result.includes("[REDACTED]"));
    });

    it("should redact PEM keys", () => {
        const input = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----";
        const result = redactSecrets(input);
        assert.ok(!result.includes("MIIEpAIBAAKCAQEA"));
    });

    it("should redact password fields", () => {
        const input = "PASSWORD=mysecretpassword123";
        const result = redactSecrets(input);
        assert.ok(!result.includes("mysecretpassword123"));
    });

    it("should leave normal content untouched", () => {
        const input = "const express = require('express');";
        const result = redactSecrets(input);
        assert.strictEqual(result, input);
    });
});

// ─── Integration Test ────────────────────────────────────────────

describe("Agent Tools Integration", () => {
    it("should validate a full path → command → redaction workflow", () => {
        const workspaceRoot = "/var/app";

        // Paths under workspace pass
        assert.strictEqual(validateAgentPath("/var/app/src/server.ts", workspaceRoot), null);

        // Commands for project are allowed
        assert.strictEqual(validateCommand("npm test"), null);
        assert.strictEqual(validateCommand("tsc --noEmit"), null);

        // Dangerous patterns are blocked
        assert.notStrictEqual(validateCommand("rm -rf /var/app"), null);

        // Secrets are redacted
        const output = "Connected with SECRET_KEY=abc123xyz";
        assert.ok(redactSecrets(output).includes("[REDACTED]"));

        // Paths outside workspace are blocked
        assert.notStrictEqual(validateAgentPath("/etc/shadow", workspaceRoot), null);
    });
});
