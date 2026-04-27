import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath } from '../../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const workspacePath = getWorkspacePath();
    const fullPath = path.join(workspacePath, filePath);

    // Security check
    if (!fullPath.startsWith(workspacePath)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read script:', error);
    return NextResponse.json({ error: 'Failed to read script' }, { status: 500 });
  }
}
