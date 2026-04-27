import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath } from '../../lib/paths';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const logType = searchParams.get('logType');

    let fileName = '';
    if (logType === 'system') {
      fileName = 'system_health_log.jsonl';
    } else if (logType === 'model') {
      fileName = 'model_health_log.jsonl';
    } else {
      return NextResponse.json({ error: 'Invalid logType specified' }, { status: 400 });
    }

    const filePath = path.join(getWorkspacePath(), 'logs', fileName);
    const content = await fs.readFile(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to fetch log:', error);
    return NextResponse.json({ error: 'Failed to load log' }, { status: 500 });
  }
}
