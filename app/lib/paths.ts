import path from 'path';
import os from 'os';

// Mission Control app is located at `<workspace-root>/tools/mc`
// By navigating up two directories from process.cwd() (which is `tools/mc` during Next.js run),
// we dynamically resolve the workspace root without hardcoding it.
export const OPENCLAW_ROOT = path.resolve(process.cwd(), '../..');

export const getSessionsPath = () => path.join(OPENCLAW_ROOT, 'agents/main/sessions');
export const getCronPath = () => path.join(OPENCLAW_ROOT, 'cron');
export const getToolsPath = () => path.join(OPENCLAW_ROOT, 'tools');

export const getWorkspacePath = () => path.join(OPENCLAW_ROOT, 'workspace');
export const getFavoritesPath = () => path.join(getWorkspacePath(), 'cmd_favorites.json');
export const getSkillsPath = () => path.join(getWorkspacePath(), 'skills');

// For system-installed skills, it may still fallback or install locally.
// E.g., on Windows, the user likely won't have these, but we can resolve it gracefully.
export const getSystemSkillsPath = () => path.join(os.homedir(), '.npm-global/lib/node_modules/openclaw/skills');
