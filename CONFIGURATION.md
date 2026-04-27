# Mission Control Configuration

## Overview

Mission Control now supports being run as a separate repository while still accessing your OpenClaw folder's data and resources.

## Configuring the OpenClaw Path

### Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set the `OPENCLAW_PATH` to your OpenClaw folder:

   **macOS/Linux:**
   ```
   OPENCLAW_PATH=/Users/username/.openclaw
   ```
   or with tilde expansion:
   ```
   OPENCLAW_PATH=~/.openclaw
   ```

   **Windows:**
   ```
   OPENCLAW_PATH=C:\Users\username\.openclaw
   ```
   or:
   ```
   OPENCLAW_PATH=C:\OpenClaw
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

- **`OPENCLAW_PATH`** (optional)
  - Full path to your OpenClaw folder
  - Supports tilde (`~`) expansion on Unix-like systems
  - If not set, falls back to relative path resolution (for running from `tools/mc` within OpenClaw)

### Path Resolution Priority

The app resolves the OpenClaw path in this order:

1. **`OPENCLAW_PATH` environment variable** - If set, use this exact path
2. **Relative path fallback** - Navigate up two directories from the app's location (assumes running from `tools/mc`)

### What Gets Configured

Once `OPENCLAW_PATH` is set, all of these paths are automatically resolved relative to it:

- `agents/main/sessions` - Session files
- `cron` - Cron job configuration and runs
- `tools` - Tool scripts and executables
- `workspace` - Workspace data, including:
  - `cmd_favorites.json` - Command favorites
  - `skills` - Local skill definitions
- `.env` - The OpenClaw environment file (for API keys, etc.)

## Notes

- `.env.local` is **not committed to git** (see `.gitignore`) - it's local to your machine
- The `.env.example` file shows the format and can be shared in the repository
- Path expansion with `~` is supported for home directories on Unix-like systems
- Windows paths should use forward slashes (`/`) or backslashes (`\`), both are supported
