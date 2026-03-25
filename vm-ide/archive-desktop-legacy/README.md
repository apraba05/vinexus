# InfraNexus Desktop

Electron-based desktop application for InfraNexus cloud IDE.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (loads localhost:3000)
DEV_URL=http://localhost:3000 npm run dev

# Run in production mode (loads infranexus.dev)
npm run dev
```

## Build Installers

```bash
# macOS (.dmg + .zip)
npm run package:mac

# Windows (.exe NSIS installer)
npm run package:win

# Both platforms
npm run package:all
```

Output goes to `release/`.

## Architecture

- **`src/main.ts`** — Electron main process: BrowserWindow, auto-updater, menu, security
- **`src/preload.ts`** — Secure preload bridging `window.infranexus` API
- **`assets/`** — App icons (`.icns` for macOS, `.ico` for Windows)

## Auto-Updates

Uses `electron-updater` with GitHub Releases as the update feed. Configured in `package.json` under `build.publish`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `INFRANEXUS_URL` | Backend URL to load | `https://infranexus.dev` |
| `DEV_URL` | Local dev URL (dev mode only) | — |
