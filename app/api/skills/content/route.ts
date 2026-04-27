import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getSkillsPath, getSystemSkillsPath } from '../../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const name = searchParams.get('name');
  const filename = searchParams.get('filename') || 'SKILL.md';

  if (!origin || !name) {
    return NextResponse.json({ error: 'Origin and name are required' }, { status: 400 });
  }

  try {
    let baseDir = origin === 'workspace' 
      ? getSkillsPath()
      : getSystemSkillsPath();

    const fullPath = path.join(baseDir, name, filename);

    // Security check: ensure path stays within known skills dirs
    const workspacePrefix = getSkillsPath();
    const systemPrefix = getSystemSkillsPath();

    if (!fullPath.startsWith(workspacePrefix) && !fullPath.startsWith(systemPrefix)) {
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    const content = await fs.readFile(fullPath, 'utf8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read skill file:', error);
    return NextResponse.json({ error: 'Failed to read skill file' }, { status: 500 });
  }
}
