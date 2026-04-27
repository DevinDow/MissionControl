import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionsPath } from '../../lib/paths';

export async function GET() {
  const reqStart = Date.now();
  console.log('[API/history] Request started');
  try {
    const sessionsDir = getSessionsPath();
    console.log('[API/history] Reading directory:', sessionsDir);
    const dirStart = Date.now();
    const files = await fs.readdir(sessionsDir);
    console.log(`[API/history] Reading directory finished in ${Date.now() - dirStart}ms. Found ${files.length} files.`);
    
    // Find all .jsonl files including .reset and .deleted
    // Filter out .lock files which are temporary system locks
    const logFiles = files.filter(f => f.includes('.jsonl') && !f.endsWith('.lock'));
    
    // Read sessions.json for labels
    console.log('[API/history] Reading sessions.json...');
    const readStart = Date.now();
    const sessionsJsonContent = await fs.readFile(path.join(sessionsDir, 'sessions.json'), 'utf8');
    const sessionsJson = JSON.parse(sessionsJsonContent);
    console.log(`[API/history] Reading sessions.json finished in ${Date.now() - readStart}ms`);

    console.log(`[API/history] Processing ${logFiles.length} log files...`);
    const procStart = Date.now();
    const allSessions = await Promise.all(logFiles.map(async (f) => {
      try {
        const filePath = path.join(sessionsDir, f);
        const stats = await fs.stat(filePath);
        
        // Extract original sessionId from filename (UUID)
        const sessionId = f.split('.')[0];
        
        // Find entry in sessions.json
        const [key, jsonEntry]: [string, any] = Object.entries(sessionsJson).find(([k, entry]: [string, any]) => entry.sessionId === sessionId) || ['', null];
        const label = jsonEntry?.label || (sessionId === 'main' ? 'Main Session' : sessionId);

        return {
          fileId: f,
          sessionId,
          key,
          label,
          model: jsonEntry?.model,
          modelProvider: jsonEntry?.modelProvider,
          size: stats.size,
          updatedAt: stats.mtime.getTime(),
          isReset: f.includes('.reset'),
          isDeleted: f.includes('.deleted'),
          isArchive: f.includes('.archive'),
          path: filePath
        };
      } catch {
        return null;
      }
    }));
    console.log(`[API/history] Processing log files finished in ${Date.now() - procStart}ms`);

    const validSessions = allSessions
      .filter((s): s is any => s !== null);
    
    // Explicit sort by updatedAt descending
    validSessions.sort((a, b) => b.updatedAt - a.updatedAt);

    console.log(`[API/history] Request completed in ${Date.now() - reqStart}ms, returning ${validSessions.length} items`);
    return NextResponse.json(validSessions);
  } catch (error) {
    console.error(`[API/history] Request failed after ${Date.now() - reqStart}ms:`, error);
    return NextResponse.json({ error: 'Failed to load session history' }, { status: 500 });
  }
}
