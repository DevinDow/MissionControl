import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { OPENCLAW_ROOT } from '../../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const baseDir = OPENCLAW_ROOT;
    const fullPath = path.join(baseDir, filePath);

    // Security check: ensure the path is within the base dir
    if (!fullPath.startsWith(baseDir)) {
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    const content = await fs.readFile(fullPath, 'utf8');
    const stats = await fs.stat(fullPath);

    return NextResponse.json({
      content,
      metadata: {
        size: stats.size,
        updatedAt: stats.mtime.getTime(),
        path: filePath
      }
    });
  } catch (error) {
    console.error('Failed to read system file:', error);
    return NextResponse.json({ error: 'Failed to read system file' }, { status: 500 });
  }
}
