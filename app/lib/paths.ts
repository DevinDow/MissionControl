import path from 'path';
import os from 'os';

/**
 * Get the OpenClaw root directory
 * Priority:
 * 1. OPENCLAW_PATH environment variable (if set)
 * 2. Relative path from current working directory (for development when running from tools/mc)
 */
function getOpenClawRoot(): string {
  // Check if explicitly configured via environment variable
  const configuredPath = process.env.OPENCLAW_PATH?.trim();
  if (configuredPath) {
    // Support tilde expansion for home directory
    if (configuredPath.startsWith('~')) {
      return configuredPath.replace('~', os.homedir());
    }
    return configuredPath;
  }

  // Fallback to relative path resolution
  // Mission Control app was originally located at `<openclaw-root>/tools/mc` (because it was vibe-coded with OpenClaw Agent as a tiny tool within the OpenClaw repo, but it quickly outgrew that).
  // By navigating up two directories from process.cwd() (which is `tools/mc` during Next.js run),
  // we dynamically resolve the workspace root without hardcoding it.
  return path.resolve(process.cwd(), '../..');
}

export const OPENCLAW_ROOT = getOpenClawRoot();

export const getSessionsPath = () => path.join(OPENCLAW_ROOT, 'agents/main/sessions');
export const getCronPath = () => path.join(OPENCLAW_ROOT, 'cron');
export const getToolsPath = () => path.join(OPENCLAW_ROOT, 'tools');

export const getWorkspacePath = () => path.join(OPENCLAW_ROOT, 'workspace');
export const getFavoritesPath = () => path.join(getWorkspacePath(), 'cmd_favorites.json');
export const getSkillsPath = () => path.join(getWorkspacePath(), 'skills');

// For system-installed skills, it may still fallback or install locally.
// E.g., on Windows, the user likely won't have these, but we can resolve it gracefully.
export const getSystemSkillsPath = () => path.join(os.homedir(), '.npm-global/lib/node_modules/openclaw/skills');
