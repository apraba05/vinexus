/**
 * Worker thread for the Next.js standalone frontend server.
 * Runs inside the main Electron process (same OS process, same PID),
 * so it never appears as a separate entry in the macOS Dock.
 */
const { workerData } = require("worker_threads");
require(workerData.serverPath);
