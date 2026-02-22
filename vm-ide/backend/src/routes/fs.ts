import { Router, Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import { getSession } from "../sessionStore";
import { FileEntryWithStats } from "ssh2";
import { structuredPatch } from "diff";
import { backupManager } from "../services/backupManager";
import {
  DiffHunk,
  DiffResult,
  sftpStat,
  sftpReadFile,
  sftpWriteFile,
  sftpRename,
} from "../types";

const router = Router();
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "2097152", 10); // 2MB
const LARGE_FILE_WARNING = 512 * 1024; // 500KB

function requireSession(req: Request, res: Response): ReturnType<typeof getSession> | null {
  const sessionId = (req.query.sessionId || req.body.sessionId) as string;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return null;
  }
  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found or expired" });
    return null;
  }
  return session;
}

// ─── List directory ──────────────────────────────────────────────

router.get("/list", (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const dirPath = (req.query.path as string) || "/";

  session.sftp.readdir(dirPath, (err, list: FileEntryWithStats[]) => {
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
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    res.json({ path: dirPath, entries });
  });
});

// ─── Read file ───────────────────────────────────────────────────

router.get("/read", (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: "path is required" });
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

    const chunks: Buffer[] = [];
    const stream = session.sftp.createReadStream(filePath);

    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
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
        warning:
          stats.size > LARGE_FILE_WARNING
            ? `Large file (${(stats.size / 1024).toFixed(0)}KB). Edits may be slow.`
            : undefined,
      });
    });
    stream.on("error", (readErr: Error) => {
      res.status(500).json({ error: "Failed to read file: " + readErr.message });
    });
  });
});

// ─── Write file (enhanced: safe write + backup) ─────────────────

router.post("/write", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const {
    path: filePath,
    content,
    safeWrite = true,
    createBackup = true,
  } = req.body;

  if (!filePath) {
    res.status(400).json({ error: "path is required" });
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
    let previousSize: number | undefined;
    let fileExists = false;
    try {
      const stats = await sftpStat(session.sftp, filePath);
      previousSize = stats.size;
      fileExists = true;
    } catch {
      // File is new
    }

    // Create backup of existing file
    let backupPath: string | undefined;
    if (createBackup && fileExists) {
      try {
        const backup = await backupManager.createBackup(
          session.id,
          filePath
        );
        backupPath = backup?.path;
      } catch (backupErr: any) {
        console.warn(`[fs] Backup failed for ${filePath}: ${backupErr.message}`);
        // Non-fatal — continue with write
      }
    }

    if (safeWrite) {
      // Safe write: temp file -> atomic rename
      const dir = path.dirname(filePath);
      const tmpName = `.vmide-tmp.${crypto.randomBytes(6).toString("hex")}`;
      const tmpPath = path.join(dir, tmpName);

      try {
        // Write to temp file
        await sftpWriteFile(session.sftp, tmpPath, buf);

        // Atomic rename temp -> target
        await sftpRename(session.sftp, tmpPath, filePath);
      } catch (writeErr: any) {
        // Clean up temp file on failure
        try {
          const { sftpUnlink } = await import("../types");
          await sftpUnlink(session.sftp, tmpPath);
        } catch {
          // Ignore cleanup failure
        }
        throw writeErr;
      }
    } else {
      // Direct write (legacy behavior)
      await sftpWriteFile(session.sftp, filePath, buf);
    }

    res.json({
      ok: true,
      path: filePath,
      size: buf.length,
      backupPath,
      previousSize,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to write file: " + err.message });
  }
});

// ─── Diff (compare current file with proposed content) ───────────

router.post("/diff", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { path: filePath, newContent } = req.body;
  if (!filePath) {
    res.status(400).json({ error: "path is required" });
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
      const buf = await sftpReadFile(session.sftp, filePath);
      currentContent = buf.toString("utf-8");
    } catch {
      // File doesn't exist yet — diff against empty
    }

    // Compute diff
    const patch = structuredPatch(
      filePath,
      filePath,
      currentContent,
      newContent,
      "current",
      "modified"
    );

    let additions = 0;
    let deletions = 0;

    const hunks: DiffHunk[] = patch.hunks.map((h) => {
      const lines = h.lines;
      for (const line of lines) {
        if (line.startsWith("+")) additions++;
        else if (line.startsWith("-")) deletions++;
      }
      return {
        oldStart: h.oldStart,
        oldLines: h.oldLines,
        newStart: h.newStart,
        newLines: h.newLines,
        lines,
      };
    });

    const result: DiffResult = { hunks, additions, deletions };
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to compute diff: " + err.message });
  }
});

// ─── List backups for a file ─────────────────────────────────────

router.get("/backups", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  try {
    const backups = await backupManager.listBackups(session.id, filePath);
    res.json({ path: filePath, backups });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list backups: " + err.message });
  }
});

// ─── Restore a backup ───────────────────────────────────────────

router.post("/restore", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { backupPath, targetPath } = req.body;
  if (!backupPath || !targetPath) {
    res.status(400).json({ error: "backupPath and targetPath are required" });
    return;
  }

  try {
    await backupManager.restoreBackup(session.id, backupPath, targetPath);
    res.json({ ok: true, path: targetPath });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to restore backup: " + err.message });
  }
});

// ─── Create directory ────────────────────────────────────────────

router.post("/mkdir", (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { path: dirPath } = req.body;
  if (!dirPath) {
    res.status(400).json({ error: "path is required" });
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

router.post("/rename", (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) {
    res.status(400).json({ error: "oldPath and newPath are required" });
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

router.post("/delete", (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { path: targetPath, recursive = false } = req.body;
  if (!targetPath) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  if (recursive) {
    session.conn.exec(`rm -rf "${targetPath}"`, (err, stream) => {
      if (err) {
        res.status(500).json({ error: "Failed to delete: " + err.message });
        return;
      }
      let stderr = "";
      stream.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      stream.on("close", (code: number) => {
        if (code !== 0) {
          res.status(500).json({ error: "Delete failed: " + stderr });
          return;
        }
        res.json({ ok: true, path: targetPath });
      });
    });
  } else {
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

export default router;
