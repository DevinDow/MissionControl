import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout: helpOut } = await execAsync('openclaw --help');
    return NextResponse.json({ content: helpOut });
  } catch (error) {
    return NextResponse.json({ content: "OpenClaw CLI is not available in the current environment.\nMock response: Not running." });
  }
}
