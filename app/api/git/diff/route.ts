import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { OPENCLAW_ROOT } from '../../../lib/paths';

const execAsync = promisify(exec);

/**
 * GET /api/git/diff?file=path/to/file
 * OR  /api/git/diff?commit=hash
 * 
 * Fetches the diff for a specific file or an entire commit.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const commit = searchParams.get('commit');

  try {
    if (commit) {
      // Fetch diff for an entire commit (all files)
      // `git show [hash] --patch` displays the commit message and the full patch
      // We'll parse this into chunks per file for the UI to handle collapsing
      const { stdout } = await execAsync(
        `git -C ${OPENCLAW_ROOT} show ${commit} --patch`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 } // Increase maxBuffer to 10MB
      );
      
      const lines = stdout.split('\n');
      const files: Array<{ name: string, patch: string }> = [];
      let currentFile: { name: string, patch: string } | null = null;
      let header = '';

      for (const line of lines) {
        if (line.startsWith('diff --git')) {
          if (currentFile) files.push(currentFile);
          // Extract filename from "diff --git a/file.txt b/file.txt"
          const match = line.match(/b\/(.+)$/);
          currentFile = { name: match ? match[1] : 'Unknown File', patch: line + '\n' };
        } else if (currentFile) {
          currentFile.patch += line + '\n';
        } else {
          header += line + '\n';
        }
      }
      if (currentFile) files.push(currentFile);

      return NextResponse.json({ 
        header,
        files 
      });
    }

    if (!file) {
      return NextResponse.json({ error: 'File or Commit parameter required' }, { status: 400 });
    }

    // Standard file-level diff logic (Staged vs Unstaged)
    const { stdout: unstagedStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} diff "${file}"`,
      { encoding: 'utf8' }
    );

    const { stdout: stagedStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} diff --staged "${file}"`,
      { encoding: 'utf8' }
    );

    // Check if the file is untracked
    const { stdout: statusStdout } = await execAsync(
      `git -C ${OPENCLAW_ROOT} status --porcelain "${file}"`,
      { encoding: 'utf8' }
    );

    let untracked = null;
    if (statusStdout.startsWith('??')) {
      try {
        const fullPath = join(OPENCLAW_ROOT, file);
        const content = await readFile(fullPath, 'utf8');
        // Format as a pseudo-diff of additions
        untracked = content.split('\n').map(line => `+${line}`).join('\n');
      } catch (err) {
        console.error(`Failed to read untracked file ${file}:`, err);
      }
    }

    return NextResponse.json({
      staged: stagedStdout || null,
      unstaged: unstagedStdout || null,
      untracked
    });

  } catch (error: any) {
    console.error('Git Diff API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
