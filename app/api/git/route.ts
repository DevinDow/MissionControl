import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { OPENCLAW_ROOT } from '../../lib/paths';

// Promisify exec to use async/await for cleaner control flow
const execAsync = promisify(exec);

/**
 * GET /api/git
 * 
 * Aggregates core repository metadata including recent history, 
 * local/remote divergence, and the current state of the working tree.
 */
export async function GET() {
  try {
    // 1. Fetch the last 5 commits from the history
    // We use a custom delimiter (|) to make parsing robust.
    // %h: short hash, %s: subject, %an: author name, %ar: relative date
    const { stdout: logStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} log -n 5 --pretty=format:"%h|%s|%an|%ar"`,
      { encoding: 'utf8' }
    );

    const commits = logStdout.split('\n').filter(Boolean).map(line => {
      const [hash, subject, author, date] = line.split('|');
      return { hash, subject, author, date };
    });

    // Current branch (or short hash when detached)
    const { stdout: branchStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} branch --show-current`,
      { encoding: 'utf8' }
    );
    let branch = branchStdout.trim();
    if (!branch) {
      const { stdout: shortHead } = await execAsync(
        `git -C ${OPENCLAW_ROOT} rev-parse --short HEAD`,
        { encoding: 'utf8' }
      );
      branch = `detached @ ${shortHead.trim()}`;
    }

    // 2. Determine if the local branch is 'ahead' of origin/main
    // This count is used to enable/disable the 'Push' button in the UI.
    const { stdout: revStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} rev-list origin/main..main --count`,
      { encoding: 'utf8' }
    );
    const aheadCount = parseInt(revStdout.trim(), 10) || 0;

    // 3. Parse the current status of the working tree using --porcelain
    // Porcelain mode is stable across git versions and designed for script consumption.
    const { stdout: statusStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} status --porcelain`,
      { encoding: 'utf8' }
    );

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    statusStdout.split('\n').filter(Boolean).forEach(line => {
      // Porcelain status uses two columns: [index][worktree]
      const state = line.slice(0, 2);
      const file = line.slice(3).trim();
      
      // Column 1 (index): 'M' = modified (staged), 'A' = added, 'D' = deleted
      if (state[0] !== ' ' && state[0] !== '?') staged.push(file);
      
      // Column 2 (worktree): 'M' = modified (unstaged), 'D' = deleted (unstaged)
      if (state[1] !== ' ' && state[1] !== '?') unstaged.push(file);
      
      // '??' indicates a file that is not yet tracked by git
      if (state === '??') untracked.push(file);
    });

    // 4. Fetch the full hash of the remote HEAD
    // This allows the UI to highlight which local commit matches the remote.
    const { stdout: remoteStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} rev-parse origin/main`,
      { encoding: 'utf8' }
    );
    const remoteHash = remoteStdout.trim();

    return NextResponse.json({
      commits,
      branch,
      aheadCount,
      remoteHash,
      staged,
      unstaged,
      untracked
    });
  } catch (error: any) {
    console.error('Git API GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/git
 * 
 * Entry point for mutating Git state (staging, committing, pushing).
 * This endpoint executes shell commands directly on the host.
 */
export async function POST(request: Request) {
  try {
    const { action, file, message } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let command = '';

    // Route based on the requested UI action
    switch (action) {
      case 'stage':
        // 'add .' stages all changes; 'add [file]' stages a specific path
        command = file ? `git -C ${OPENCLAW_ROOT} add "${file}"` : `git -C ${OPENCLAW_ROOT} add .`;
        break;
      case 'unstage':
        // 'restore --staged' is the modern way to remove files from the index
        // 'reset' is used for bulk unstaging
        command = file ? `git -C ${OPENCLAW_ROOT} restore --staged "${file}"` : `git -C ${OPENCLAW_ROOT} reset`;
        break;
      case 'commit':
        if (!message) {
          return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
        }
        // Execute commit with the provided message
        // We escape double quotes to prevent shell injection/breakage
        command = `git -C ${OPENCLAW_ROOT} commit -m "${message.replace(/"/g, '\\"')}"`;
        break;
      case 'push':
        // Standard push to origin main
        command = `git -C ${OPENCLAW_ROOT} push origin main`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Execute the constructed command and capture results
    const { stdout, stderr } = await execAsync(command, { encoding: 'utf8' });
    
    return NextResponse.json({
      success: true,
      stdout: stdout || '(No output)',
      stderr: stderr || ''
    });

  } catch (error: any) {
    console.error('Git API POST Error:', error);
    // Important: Return stderr in the JSON response so the UI can alert the user to Git conflicts/errors
    return NextResponse.json({ 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 });
  }
}
