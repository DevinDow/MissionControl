import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

async function getJsonFiles(dir: string, baseDir: string): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: any[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // Exclude noisy directories
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'user-data', 'OLD'].includes(entry.name)) continue;
      
      const children = await getJsonFiles(fullPath, baseDir);
      if (children.length > 0) {
        files.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const stats = await fs.stat(fullPath);
      files.push({
        name: entry.name,
        type: 'file',
        path: relativePath,
        updatedAt: stats.mtimeMs
      });
    }
  }

  // Sort: directories then files, alphabetically
  return files.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  try {
    const { OPENCLAW_ROOT } = await import('../../lib/paths');
    const baseDir = OPENCLAW_ROOT;
    const files = await getJsonFiles(baseDir, baseDir);
    return NextResponse.json(files);
  } catch (error) {
    console.error('Failed to fetch system files:', error);
    return NextResponse.json({ error: 'Failed to load system files' }, { status: 500 });
  }
}
