import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { OPENCLAW_ROOT } from '../../../lib/paths';

const execAsync = promisify(exec);

/**
 * GET /api/git/pulse
 * Returns a unique fingerprint of the current git state.
 * Detects: 
 * 1. File structure changes (new/deleted/renamed files)
 * 2. Staging changes (staged vs unstaged)
 * 3. Content changes (even subsequent edits to an already modified file via mtime)
 */
export async function GET() {
  try {
    // 1. Get porcelain status (fastest structure check)
    // We filter out high-churn session logs and database files to avoid false-positives
    const { stdout: statusStdoutRaw } = await execAsync(
      `git -C ${OPENCLAW_ROOT} status --porcelain`,
      { encoding: 'utf8' }
    );

    const statusStdout = statusStdoutRaw.split('\n')
      .filter(line => {
        const file = line.slice(3).trim();
        // Ignore internal state files, logs, and high-churn session data
        return !file.startsWith('agents/') &&
          !file.startsWith('.sqlite') &&
          !file.endsWith('.log') &&
          !file.endsWith('.db') &&
          !file.endsWith('.bak');
      })
      .join('\n');

    // 2. Extract filenames to check mtimes
    const lines = statusStdout.split('\n').filter(Boolean);

    // We also want to detect if local main is ahead of origin/main
    const { stdout: revStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} rev-parse main origin/main`,
      { encoding: 'utf8' }
    );

    // 3. For any modified/untracked file, get its latest mtime
    let maxMtime = 0;
    for (const line of lines) {
      try {
        const file = line.slice(3).trim();
        const stats = await fs.stat(path.join(OPENCLAW_ROOT, file));
        if (stats.mtimeMs > maxMtime) maxMtime = stats.mtimeMs;
      } catch (e) {
        // File might have been deleted/moved since status run
      }
    }

    // 4. Create a unique fingerprint
    // Combining status text, max mtime, and branch pointers
    const fingerprintRaw = `${statusStdout}|${maxMtime}|${revStdout}`;
    const fingerprint = crypto.createHash('md5').update(fingerprintRaw).digest('hex');

    return NextResponse.json({
      fingerprint,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('Git Pulse API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
