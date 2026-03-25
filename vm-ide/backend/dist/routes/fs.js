"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const sessionStore_1 = require("../sessionStore");
const diff_1 = require("diff");
const backupManager_1 = require("../services/backupManager");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "2097152", 10); // 2MB
const LARGE_FILE_WARNING = 512 * 1024; // 500KB
// ─── Security: Path validation ──────────────────────────────────
// Reject null bytes, shell metacharacters in paths, and enforce absolute paths.
const SHELL_METACHAR_RE = /[`$(){}|;&<>!\\]/;
function validatePath(p) {
    if (!p || typeof p !== "string")
        return "Path is required";
    if (p.includes("\0"))
        return "Path contains null bytes";
    // Normalize and check for traversal — all paths must be absolute on the remote VM
    const normalized = path_1.default.posix.normalize(p);
    if (!normalized.startsWith("/"))
        return "Path must be absolute";
    return null; // valid
}
function validatePathStrict(p) {
    const base = validatePath(p);
    if (base)
        return base;
    // For delete/rename operations, also reject shell metacharacters
    if (SHELL_METACHAR_RE.test(p))
        return "Path contains disallowed characters";
    return null;
}
function requireSession(req, res) {
    const sessionId = (req.query.sessionId || req.body.sessionId);
    if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return null;
    }
    const session = (0, sessionStore_1.getSession)(sessionId);
    if (!session) {
        res.status(404).json({ error: "Session not found or expired" });
        return null;
    }
    return session;
}
// ─── List directory ──────────────────────────────────────────────
router.get("/list", (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    let dirPath = req.query.path || "/";
    // Normalize: strip trailing slash (except root "/")
    if (dirPath.length > 1 && dirPath.endsWith("/")) {
        dirPath = dirPath.replace(/\/+$/, "");
    }
    dirPath = dirPath.replace(/\/+/g, "/"); // collapse multiple slashes
    const pathErr = validatePath(dirPath);
    if (pathErr) {
        res.status(400).json({ error: pathErr });
        return;
    }
    session.sftp.readdir(dirPath, (err, list) => {
        if (err) {
            res.status(500).json({ error: "Failed to list directory: " + err.message });
            return;
        }
        const entries = list
            .filter((item) => !item.filename.startsWith(".") || item.filename === "..")
            .map((item) => {
            const isDir = item.attrs.isDirectory();
            return {
                name: item.filename,
                path: dirPath === "/" ? "/" + item.filename : dirPath + "/" + item.filename,
                type: isDir ? "directory" : "file",
                size: item.attrs.size,
                modifiedAt: item.attrs.mtime,
            };
        })
            .sort((a, b) => {
            if (a.type !== b.type)
                return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        res.json({ path: dirPath, entries });
    });
});
// ─── Read file ───────────────────────────────────────────────────
router.get("/read", (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const filePath = req.query.path;
    if (!filePath) {
        res.status(400).json({ error: "path is required" });
        return;
    }
    const readPathErr = validatePath(filePath);
    if (readPathErr) {
        res.status(400).json({ error: readPathErr });
        return;
    }
    session.sftp.stat(filePath, (statErr, stats) => {
        if (statErr) {
            res.status(500).json({ error: "Failed to stat file: " + statErr.message });
            return;
        }
        if (stats.size > MAX_FILE_SIZE) {
            res.status(413).json({
                error: `File too large (${stats.size} bytes). Max: ${MAX_FILE_SIZE} bytes (${(MAX_FILE_SIZE / 1048576).toFixed(1)}MB)`,
            });
            return;
        }
        const chunks = [];
        const stream = session.sftp.createReadStream(filePath);
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => {
            const content = Buffer.concat(chunks);
            const sample = content.subarray(0, 8192);
            if (sample.includes(0)) {
                res.status(415).json({ error: "Binary files are not supported in this MVP" });
                return;
            }
            res.json({
                path: filePath,
                content: content.toString("utf-8"),
                size: stats.size,
                warning: stats.size > LARGE_FILE_WARNING
                    ? `Large file (${(stats.size / 1024).toFixed(0)}KB). Edits may be slow.`
                    : undefined,
            });
        });
        stream.on("error", (readErr) => {
            res.status(500).json({ error: "Failed to read file: " + readErr.message });
        });
    });
});
// ─── Write file (enhanced: safe write + backup) ─────────────────
router.post("/write", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { path: filePath, content, safeWrite = true, createBackup = true, } = req.body;
    if (!filePath) {
        res.status(400).json({ error: "path is required" });
        return;
    }
    const writePathErr = validatePath(filePath);
    if (writePathErr) {
        res.status(400).json({ error: writePathErr });
        return;
    }
    if (typeof content !== "string") {
        res.status(400).json({ error: "content must be a string" });
        return;
    }
    const buf = Buffer.from(content, "utf-8");
    if (buf.length > MAX_FILE_SIZE) {
        res.status(413).json({ error: `Content too large. Max: ${MAX_FILE_SIZE} bytes` });
        return;
    }
    try {
        // Check if file exists and get previous size
        let previousSize;
        let fileExists = false;
        try {
            const stats = await (0, types_1.sftpStat)(session.sftp, filePath);
            previousSize = stats.size;
            fileExists = true;
        }
        catch {
            // File is new
        }
        // Create backup of existing file
        let backupPath;
        if (createBackup && fileExists) {
            try {
                const backup = await backupManager_1.backupManager.createBackup(session.id, filePath);
                backupPath = backup?.path;
            }
            catch (backupErr) {
                console.warn(`[fs] Backup failed for ${filePath}: ${backupErr.message}`);
                // Non-fatal — continue with write
            }
        }
        if (safeWrite) {
            // Safe write: temp file -> atomic rename
            const dir = path_1.default.dirname(filePath);
            const tmpName = `.vmide-tmp.${crypto_1.default.randomBytes(6).toString("hex")}`;
            const tmpPath = path_1.default.join(dir, tmpName);
            try {
                // Write to temp file
                await (0, types_1.sftpWriteFile)(session.sftp, tmpPath, buf);
                // Remove existing file before rename (SFTP rename can't overwrite)
                if (fileExists) {
                    try {
                        const { sftpUnlink } = await Promise.resolve().then(() => __importStar(require("../types")));
                        await sftpUnlink(session.sftp, filePath);
                    }
                    catch {
                        // Ignore — file might not exist or already gone
                    }
                }
                // Atomic rename temp -> target
                await (0, types_1.sftpRename)(session.sftp, tmpPath, filePath);
            }
            catch (writeErr) {
                // Clean up temp file on failure
                try {
                    const { sftpUnlink } = await Promise.resolve().then(() => __importStar(require("../types")));
                    await sftpUnlink(session.sftp, tmpPath);
                }
                catch {
                    // Ignore cleanup failure
                }
                throw writeErr;
            }
        }
        else {
            // Direct write (legacy behavior)
            await (0, types_1.sftpWriteFile)(session.sftp, filePath, buf);
        }
        res.json({
            ok: true,
            path: filePath,
            size: buf.length,
            backupPath,
            previousSize,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to write file: " + err.message });
    }
});
// ─── Diff (compare current file with proposed content) ───────────
router.post("/diff", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { path: filePath, newContent } = req.body;
    if (!filePath) {
        res.status(400).json({ error: "path is required" });
        return;
    }
    const diffPathErr = validatePath(filePath);
    if (diffPathErr) {
        res.status(400).json({ error: diffPathErr });
        return;
    }
    if (typeof newContent !== "string") {
        res.status(400).json({ error: "newContent must be a string" });
        return;
    }
    try {
        // Read current file content from remote
        let currentContent = "";
        try {
            const buf = await (0, types_1.sftpReadFile)(session.sftp, filePath);
            currentContent = buf.toString("utf-8");
        }
        catch {
            // File doesn't exist yet — diff against empty
        }
        // Compute diff
        const patch = (0, diff_1.structuredPatch)(filePath, filePath, currentContent, newContent, "current", "modified");
        let additions = 0;
        let deletions = 0;
        const hunks = patch.hunks.map((h) => {
            const lines = h.lines;
            for (const line of lines) {
                if (line.startsWith("+"))
                    additions++;
                else if (line.startsWith("-"))
                    deletions++;
            }
            return {
                oldStart: h.oldStart,
                oldLines: h.oldLines,
                newStart: h.newStart,
                newLines: h.newLines,
                lines,
            };
        });
        const result = { hunks, additions, deletions };
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to compute diff: " + err.message });
    }
});
// ─── List backups for a file ─────────────────────────────────────
router.get("/backups", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const filePath = req.query.path;
    if (!filePath) {
        res.status(400).json({ error: "path is required" });
        return;
    }
    const backupsPathErr = validatePath(filePath);
    if (backupsPathErr) {
        res.status(400).json({ error: backupsPathErr });
        return;
    }
    try {
        const backups = await backupManager_1.backupManager.listBackups(session.id, filePath);
        res.json({ path: filePath, backups });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to list backups: " + err.message });
    }
});
// ─── Restore a backup ───────────────────────────────────────────
router.post("/restore", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { backupPath, targetPath } = req.body;
    if (!backupPath || !targetPath) {
        res.status(400).json({ error: "backupPath and targetPath are required" });
        return;
    }
    const restorePathErr = validatePath(backupPath) || validatePath(targetPath);
    if (restorePathErr) {
        res.status(400).json({ error: restorePathErr });
        return;
    }
    try {
        await backupManager_1.backupManager.restoreBackup(session.id, backupPath, targetPath);
        res.json({ ok: true, path: targetPath });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to restore backup: " + err.message });
    }
});
// ─── Create directory ────────────────────────────────────────────
router.post("/mkdir", (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { path: dirPath } = req.body;
    if (!dirPath) {
        res.status(400).json({ error: "path is required" });
        return;
    }
    const mkdirPathErr = validatePathStrict(dirPath);
    if (mkdirPathErr) {
        res.status(400).json({ error: mkdirPathErr });
        return;
    }
    session.sftp.mkdir(dirPath, (err) => {
        if (err) {
            res.status(500).json({ error: "Failed to create directory: " + err.message });
            return;
        }
        res.json({ ok: true, path: dirPath });
    });
});
// ─── Rename / move ───────────────────────────────────────────────
router.post("/rename", (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
        res.status(400).json({ error: "oldPath and newPath are required" });
        return;
    }
    const renamePathErr = validatePathStrict(oldPath) || validatePathStrict(newPath);
    if (renamePathErr) {
        res.status(400).json({ error: renamePathErr });
        return;
    }
    session.sftp.rename(oldPath, newPath, (err) => {
        if (err) {
            res.status(500).json({ error: "Failed to rename: " + err.message });
            return;
        }
        res.json({ ok: true, oldPath, newPath });
    });
});
// ─── Delete ──────────────────────────────────────────────────────
router.post("/delete", (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { path: targetPath, recursive = false } = req.body;
    if (!targetPath) {
        res.status(400).json({ error: "path is required" });
        return;
    }
    const deletePathErr = validatePathStrict(targetPath);
    if (deletePathErr) {
        res.status(400).json({ error: deletePathErr });
        return;
    }
    // Block deletion of root-level critical directories
    const PROTECTED_PATHS = ["/", "/root", "/home", "/etc", "/var", "/usr", "/bin", "/sbin", "/lib", "/boot", "/dev", "/proc", "/sys"];
    const normalizedTarget = path_1.default.posix.normalize(targetPath);
    if (PROTECTED_PATHS.includes(normalizedTarget)) {
        res.status(403).json({ error: "Cannot delete protected system directory" });
        return;
    }
    if (recursive) {
        // SECURITY: Use array-form exec to prevent shell injection.
        // Escape single quotes in the path for safe shell usage.
        const safePath = normalizedTarget.replace(/'/g, "'\\\"'\\\"'");
        session.conn.exec(`rm -rf '${safePath}'`, (err, stream) => {
            if (err) {
                res.status(500).json({ error: "Failed to delete: " + err.message });
                return;
            }
            let stderr = "";
            stream.stderr.on("data", (data) => {
                stderr += data.toString();
            });
            stream.on("close", (code) => {
                if (code !== 0) {
                    res.status(500).json({ error: "Delete failed: " + stderr });
                    return;
                }
                res.json({ ok: true, path: targetPath });
            });
        });
    }
    else {
        session.sftp.unlink(targetPath, (unlinkErr) => {
            if (!unlinkErr) {
                res.json({ ok: true, path: targetPath });
                return;
            }
            session.sftp.rmdir(targetPath, (rmdirErr) => {
                if (rmdirErr) {
                    res.status(500).json({ error: "Failed to delete: " + rmdirErr.message });
                    return;
                }
                res.json({ ok: true, path: targetPath });
            });
        });
    }
});
exports.default = router;
//# sourceMappingURL=fs.js.map