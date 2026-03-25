"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sftpStat = sftpStat;
exports.sftpMkdir = sftpMkdir;
exports.sftpReadFile = sftpReadFile;
exports.sftpWriteFile = sftpWriteFile;
exports.sftpRename = sftpRename;
exports.sftpUnlink = sftpUnlink;
exports.sftpReaddir = sftpReaddir;
// ─── SFTP Helpers ────────────────────────────────────────────────
function sftpStat(sftp, path) {
    return new Promise((resolve, reject) => {
        sftp.stat(path, (err, stats) => {
            if (err)
                return reject(err);
            resolve({
                size: stats.size,
                mtime: stats.mtime,
                isDirectory: stats.isDirectory(),
            });
        });
    });
}
function sftpMkdir(sftp, path) {
    return new Promise((resolve, reject) => {
        sftp.mkdir(path, (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
function sftpReadFile(sftp, path) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = sftp.createReadStream(path);
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}
function sftpWriteFile(sftp, path, data) {
    return new Promise((resolve, reject) => {
        const stream = sftp.createWriteStream(path);
        stream.on("close", () => resolve());
        stream.on("error", reject);
        stream.end(data);
    });
}
function sftpRename(sftp, oldPath, newPath) {
    return new Promise((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
function sftpUnlink(sftp, path) {
    return new Promise((resolve, reject) => {
        sftp.unlink(path, (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
function sftpReaddir(sftp, path) {
    return new Promise((resolve, reject) => {
        sftp.readdir(path, (err, list) => {
            if (err)
                return reject(err);
            resolve(list);
        });
    });
}
//# sourceMappingURL=index.js.map