import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // High-performance connectivity check
    await execAsync('nc -z localhost 18789');
    return NextResponse.json({ online: true });
  } catch (error) {
    return NextResponse.json({ online: false });
  }
}
