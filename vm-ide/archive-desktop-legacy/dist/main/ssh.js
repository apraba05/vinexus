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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHManager = void 0;
const ssh2_1 = require("ssh2");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
class SSHManager {
    client = null;
    sftp = null;
    shell = null;
    connected = false;
    async connect(config) {
        return new Promise((resolve, reject) => {
            this.client = new ssh2_1.Client();
            const connConfig = {
                host: config.host,
                port: config.port,
                username: config.username,
            };
            if (config.authMethod === "key" && config.privateKeyPath) {
                const keyPath = config.privateKeyPath.replace("~", os.homedir());
                try {
                    connConfig.privateKey = fs.readFileSync(keyPath);
                }
                catch (err) {
                    reject(new Error(`Cannot read key file: ${keyPath}`));
                    return;
                }
            }
            else if (config.authMethod === "password" && config.password) {
                connConfig.password = config.password;
            }
            this.client
                .on("ready", () => {
                this.connected = true;
                // Open SFTP channel
                this.client.sftp((err, sftp) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.sftp = sftp;
                    resolve();
                });
            })
                .on("error", (err) => {
                this.connected = false;
                reject(err);
            })
                .on("close", () => {
                this.connected = false;
                this.sftp = null;
                this.shell = null;
            })
                .connect(connConfig);
        });
    }
    disconnect() {
        if (this.shell) {
            this.shell.end();
            this.shell = null;
        }
        if (this.client) {
            this.client.end();
            this.client = null;
        }
        this.sftp = null;
        this.connected = false;
    }
    isConnected() {
        return this.connected;
    }
    async listFiles(dirPath) {
        if (!this.sftp)
            throw new Error("Not connected");
        return new Promise((resolve, reject) => {
            this.sftp.readdir(dirPath, (err, list) => {
                if (err) {
                    reject(err);
                    return;
                }
                const entries = list
                    .filter((item) => !item.filename.startsWith("."))
                    .map((item) => ({
                    name: item.filename,
                    path: path.posix.join(dirPath, item.filename),
                    isDir: item.attrs.isDirectory(),
                    size: item.attrs.size,
                }))
                    .sort((a, b) => {
                    if (a.isDir !== b.isDir)
                        return a.isDir ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
                resolve(entries);
            });
        });
    }
    async readFile(filePath) {
        if (!this.sftp)
            throw new Error("Not connected");
        return new Promise((resolve, reject) => {
            let data = "";
            const stream = this.sftp.createReadStream(filePath, { encoding: "utf8" });
            stream.on("data", (chunk) => { data += chunk; });
            stream.on("end", () => resolve(data));
            stream.on("error", reject);
        });
    }
    async writeFile(filePath, content) {
        if (!this.sftp)
            throw new Error("Not connected");
        return new Promise((resolve, reject) => {
            const stream = this.sftp.createWriteStream(filePath);
            stream.on("close", () => resolve());
            stream.on("error", reject);
            stream.end(content, "utf8");
        });
    }
    async exec(command) {
        if (!this.client)
            throw new Error("Not connected");
        return new Promise((resolve, reject) => {
            this.client.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                let output = "";
                stream.on("data", (data) => { output += data.toString(); });
                stream.stderr.on("data", (data) => { output += data.toString(); });
                stream.on("close", () => resolve(output));
            });
        });
    }
    openShell(onData, onClose) {
        if (!this.client)
            throw new Error("Not connected");
        this.client.shell({ term: "xterm-256color" }, (err, stream) => {
            if (err)
                throw err;
            this.shell = stream;
            stream.on("data", (data) => onData(data.toString()));
            stream.on("close", () => {
                this.shell = null;
                onClose();
            });
        });
    }
    writeToShell(data) {
        if (this.shell)
            this.shell.write(data);
    }
    resizeShell(cols, rows) {
        if (this.shell)
            this.shell.setWindow(rows, cols, 0, 0);
    }
}
exports.SSHManager = SSHManager;
//# sourceMappingURL=ssh.js.map