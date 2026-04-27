import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { OPENCLAW_ROOT } from '../../lib/paths';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Manually parses the root .env file.
 * Next.js usually handles this, but when spawning sub-processes on different 
 * platforms (like Windows), we want to be bulletproof about key availability.
 */
function getExtendedEnv() {
  const envPath = path.join(OPENCLAW_ROOT, '.env');
  const envVars = { ...process.env };
  
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        const firstEq = trimmed.indexOf('=');
        if (firstEq !== -1) {
          const key = trimmed.substring(0, firstEq).trim();
          let value = trimmed.substring(firstEq + 1).trim();
          // Unwrap quotes
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          envVars[key] = value;
        }
      });
    }
  } catch (err) {
    console.error('Manual .env load failed:', err);
  }
  return envVars;
}

const isWindows = process.platform === 'win32';
const DEFAULT_SHELL = isWindows ? undefined : '/bin/bash';

// Persistent state for the current session
let commandHistory: Array<{
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
}> = [];

let currentCwd = OPENCLAW_ROOT;

const MAX_HISTORY = 10;

export async function GET() {
  return NextResponse.json(commandHistory);
}

export async function POST(request: Request) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    let output = '';
    let exitCode = 0;

    // Sanitize Chrome auto-capitalization of OpenClaw
    let sanitizedCommand = command;
    if (command.startsWith('OpenClaw')) {
      sanitizedCommand = 'openclaw' + command.slice(8);
    }

    // Diagnostic data for the user
    const debugInfo = {
      platform: process.platform,
      shell: DEFAULT_SHELL || 'default',
      cwd: currentCwd,
      hasKey: !!getExtendedEnv()['OPENROUTER_API_KEY']
    };

    try {
      // Logic for persistent 'cd'
      const cdMatch = sanitizedCommand.match(/^cd\s+(.+)/);
      if (cdMatch) {
        const targetDir = cdMatch[1].trim();
        // Resolve absolute path
        const resolvedPath = targetDir.startsWith('/') || (isWindows && /^[a-zA-Z]:/.test(targetDir))
          ? targetDir 
          : path.join(currentCwd, targetDir);
        
        // Use a subshell to verify the directory exists
        await execAsync(isWindows ? `cd "${resolvedPath}"` : `cd "${resolvedPath}"`, { shell: DEFAULT_SHELL });
        currentCwd = resolvedPath;
        output = `Changed directory to: ${currentCwd}\n[DEBUG]: ${JSON.stringify(debugInfo)}`;
      } else {
        // Execute the command in the persistent CWD
        const extendedEnv = getExtendedEnv();
        const { stdout, stderr } = await execAsync(sanitizedCommand, {
          cwd: currentCwd,
          timeout: 30000,
          shell: DEFAULT_SHELL,
          env: {
            ...extendedEnv,
            // Ensure OpenClaw is in the path. Include home dir npm globally installed path for Linux.
            PATH: isWindows 
              ? process.env.PATH 
              : `${process.env.PATH}:${os.homedir()}/.npm-global/bin`
          }
        });
        output = stdout + stderr;
      }
    } catch (error: any) {
      output = (error.stdout || '') + (error.stderr || error.message || '');
      // Add diagnostic hint for ENOENT or missing keys
      if (output.includes('ENOENT')) {
          output += `\n\n[DEBUG HINT]: Shell error detected. Current platform: ${debugInfo.platform}, target shell: ${debugInfo.shell}`;
      }
      if (!debugInfo.hasKey && command.includes('test_model.py')) {
          output += `\n\n[DEBUG HINT]: OPENROUTER_API_KEY appears to be missing from the environment. Check ${path.join(OPENCLAW_ROOT, '.env')}`;
      }
      exitCode = error.code || 1;
    }

    const newEntry = {
      id: Math.random().toString(36).substring(2, 11),
      command: sanitizedCommand,
      output: output || '(No output)',
      exitCode,
      timestamp: Date.now(),
    };

    // Add to history and trim
    commandHistory = [newEntry, ...commandHistory].slice(0, MAX_HISTORY);

    return NextResponse.json(newEntry);
  } catch (error: any) {
    console.error('Cmd API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
