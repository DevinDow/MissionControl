import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getSessionsPath } from '../../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const sessionDir = getSessionsPath();
    const fileName = sessionId.includes('.jsonl') ? sessionId : `${sessionId}.jsonl`;
    const fullPath = path.join(sessionDir, fileName);

    if (!fullPath.startsWith(sessionDir)) {
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    const stats = await fs.stat(fullPath);
    
    // Count lines efficiently for .jsonl
    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    
    return NextResponse.json({ 
      sessionId,
      updatedAt: stats.mtime.getTime(),
      size: stats.size,
      lineCount: lines.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Session file not found' }, { status: 404 });
  }
}
