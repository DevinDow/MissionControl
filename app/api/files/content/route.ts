import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { OPENCLAW_ROOT, getWorkspacePath } from '../../../lib/paths';

const OPENCLAW_WORKSPACE = getWorkspacePath();

/**
 * Resolves a virtual or relative path to an absolute physical path.
 */
function resolveFilePath(filePath: string): string | null {
  if (filePath.startsWith('__ROOT__/')) {
    return path.join(OPENCLAW_ROOT, filePath.replace('__ROOT__/', ''));
  }
  if (filePath.startsWith('__MC__/')) {
    return path.join(OPENCLAW_ROOT, 'tools/mc', filePath.replace('__MC__/', ''));
  }
  if (filePath.startsWith('__TODO__/')) {
    return path.join(OPENCLAW_ROOT, filePath.replace('__TODO__/', ''));
  }
  if (filePath.startsWith('__TOOLS__/')) {
    return path.join(OPENCLAW_ROOT, 'tools', filePath.replace('__TOOLS__/', ''));
  }
  
  const absolutePath = path.resolve(OPENCLAW_WORKSPACE, filePath);
  if (absolutePath.startsWith(OPENCLAW_WORKSPACE)) {
    return absolutePath;
  }
  
  return null;
}

/**
 * GET /api/files/content?path=...
 * Reads the content of a workspace file.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const absolutePath = resolveFilePath(filePath);

    if (!absolutePath) {
      return NextResponse.json({ error: 'Access denied: Path outside allowed scope' }, { status: 403 });
    }

    const content = await fs.readFile(absolutePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('File Read Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/files/content
 * Overwrites the content of a workspace file.
 */
export async function POST(request: Request) {
  try {
    const { path: relativePath, content } = await request.json();

    if (!relativePath || content === undefined) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 });
    }

    const absolutePath = resolveFilePath(relativePath);

    if (!absolutePath) {
      return NextResponse.json({ error: 'Access denied: Path outside allowed scope' }, { status: 403 });
    }

    /* Backup not desired since we use Source Control and don't want .bak files.
    // Backup current file before overwrite (safety first)
    try {
      const currentContent = await fs.readFile(absolutePath, 'utf8');
      await fs.writeFile(`${absolutePath}.bak`, currentContent, 'utf8');
    } catch (e) {
      // If file doesn't exist yet, that's fine
    }*/

    await fs.writeFile(absolutePath, content, 'utf8');

    return NextResponse.json({ success: true, path: relativePath });
  } catch (error: any) {
    console.error('File Write Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
