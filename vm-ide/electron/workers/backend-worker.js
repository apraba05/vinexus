/**
 * Worker thread for the Express backend server.
 * Runs inside the main Electron process (same OS process, same PID),
 * so it never appears as a separate entry in the macOS Dock.
 */
const { workerData } = require("worker_threads");
require(workerData.serverPath);
