import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getToolsPath } from '../../lib/paths';

const TOOLS_ROOT = getToolsPath();

/**
 * GET /api/code?path=...
 * Lists one level of files and directories in the tools folder.
 * Supports lazy loading by allowing the client to request specific subdirectories.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const relativePath = searchParams.get('path') || '.';

  try {
    const absolutePath = path.resolve(TOOLS_ROOT, relativePath);

    // Security check: ensure the path is within TOOLS_ROOT
    if (!absolutePath.startsWith(TOOLS_ROOT)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    
    // Process entries and fetch basic metadata
    const results = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(absolutePath, entry.name);
      const relPath = path.relative(TOOLS_ROOT, entryPath);
      
      // Skip noisy/internal folders
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist') {
        return null;
      }

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: 'directory',
          path: relPath,
          hasChildren: true // Assume true for directories to enable lazy loading
        };
      } else {
        const stats = await fs.stat(entryPath);
        return {
          name: entry.name,
          type: 'file',
          path: relPath,
          updatedAt: stats.mtimeMs,
          size: stats.size
        };
      }
    }));

    // Filter out nulls and sort: directories first, then alphabetically
    const sortedResults = results
      .filter((r): r is any => r !== null)
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

    return NextResponse.json(sortedResults);
  } catch (error: any) {
    console.error('Code API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
