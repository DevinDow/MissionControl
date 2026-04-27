import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getSessionsPath } from '../../../lib/paths';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const reqStart = Date.now();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');
  console.log(`[API/sessions/content] Request started for id: ${sessionId}`);

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const limit = parseInt(searchParams.get('limit') || '10');
    const sessionDir = getSessionsPath();
    
    // If the sessionId already contains '.jsonl', use it directly. Otherwise, append '.jsonl'
    const fileName = sessionId.includes('.jsonl') ? sessionId : `${sessionId}.jsonl`;
    const fullPath = path.join(sessionDir, fileName);

    // Security check: ensure the path is within the session dir
    if (!fullPath.startsWith(sessionDir)) {
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    // Read file and slice last N lines to avoid OS-specific 'tail' commands like on Windows
    let stdout = '';
    try {
      console.log(`[API/sessions/content] Reading file: ${fullPath}...`);
      const readStart = Date.now();
      const fileContent = await fs.readFile(fullPath, 'utf8');
      console.log(`[API/sessions/content] fs.readFile took ${Date.now() - readStart}ms, length: ${fileContent.length}`);
      
      const splitStart = Date.now();
      const lines = fileContent.split('\n');
      console.log(`[API/sessions/content] string split took ${Date.now() - splitStart}ms, ${lines.length} lines`);

      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop(); // Remove trailing newline
      }
      stdout = lines.join('\n') + '\n';
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return NextResponse.json({ error: `Session file not found. It may have been reset or deleted.` }, { status: 404 });
      }
      throw e;
    }
    
    // Get latest stats for metadata refresh
    const statStart = Date.now();
    const stats = await fs.stat(fullPath);
    console.log(`[API/sessions/content] fs.stat took ${Date.now() - statStart}ms`);
    
    console.log(`[API/sessions/content] Request completed in ${Date.now() - reqStart}ms`);
    return NextResponse.json({ 
      content: stdout,
      metadata: {
        size: stats.size,
        updatedAt: stats.mtime.getTime()
      }
    });
  } catch (error: any) {
    console.error('Failed to read session file:', error);
    return NextResponse.json({ error: 'Failed to read session file' }, { status: 500 });
  }
}
