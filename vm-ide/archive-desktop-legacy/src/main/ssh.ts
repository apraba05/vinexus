import { Client, SFTPWrapper, ClientChannel } from "ssh2";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface SSHConfig {
  host: string;
  port: number;
  username: string;
  authMethod: "key" | "password";
  privateKeyPath?: string;
  password?: string;
}

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}

export class SSHManager {
  private client: Client | null = null;
  private sftp: SFTPWrapper | null = null;
  private shell: ClientChannel | null = null;
  private connected = false;

  async connect(config: SSHConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client();

      const connConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
      };

      if (config.authMethod === "key" && config.privateKeyPath) {
        const keyPath = config.privateKeyPath.replace("~", os.homedir());
        try {
          connConfig.privateKey = fs.readFileSync(keyPath);
        } catch (err: any) {
          reject(new Error(`Cannot read key file: ${keyPath}`));
          return;
        }
      } else if (config.authMethod === "password" && config.password) {
        connConfig.password = config.password;
      }

      this.client
        .on("ready", () => {
          this.connected = true;
          // Open SFTP channel
          this.client!.sftp((err, sftp) => {
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

  disconnect(): void {
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

  isConnected(): boolean {
    return this.connected;
  }

  async listFiles(dirPath: string): Promise<FileEntry[]> {
    if (!this.sftp) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.sftp!.readdir(dirPath, (err, list) => {
        if (err) { reject(err); return; }
        const entries: FileEntry[] = list
          .filter((item) => !item.filename.startsWith("."))
          .map((item) => ({
            name: item.filename,
            path: path.posix.join(dirPath, item.filename),
            isDir: (item.attrs as any).isDirectory(),
            size: item.attrs.size,
          }))
          .sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        resolve(entries);
      });
    });
  }

  async readFile(filePath: string): Promise<string> {
    if (!this.sftp) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      let data = "";
      const stream = this.sftp!.createReadStream(filePath, { encoding: "utf8" });
      stream.on("data", (chunk: string) => { data += chunk; });
      stream.on("end", () => resolve(data));
      stream.on("error", reject);
    });
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.sftp) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      const stream = this.sftp!.createWriteStream(filePath);
      stream.on("close", () => resolve());
      stream.on("error", reject);
      stream.end(content, "utf8");
    });
  }

  async exec(command: string): Promise<string> {
    if (!this.client) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.client!.exec(command, (err, stream) => {
        if (err) { reject(err); return; }
        let output = "";
        stream.on("data", (data: Buffer) => { output += data.toString(); });
        stream.stderr.on("data", (data: Buffer) => { output += data.toString(); });
        stream.on("close", () => resolve(output));
      });
    });
  }

  openShell(onData: (data: string) => void, onClose: () => void): void {
    if (!this.client) throw new Error("Not connected");
    this.client.shell({ term: "xterm-256color" }, (err, stream) => {
      if (err) throw err;
      this.shell = stream;
      stream.on("data", (data: Buffer) => onData(data.toString()));
      stream.on("close", () => {
        this.shell = null;
        onClose();
      });
    });
  }

  writeToShell(data: string): void {
    if (this.shell) this.shell.write(data);
  }

  resizeShell(cols: number, rows: number): void {
    if (this.shell) this.shell.setWindow(rows, cols, 0, 0);
  }
}
