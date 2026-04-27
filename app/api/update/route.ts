import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

/**
 * GET /api/update
 * Returns the current update availability and channel info.
 */
export async function GET() {
  try {
    const { stdout: updateOut } = await execAsync('openclaw update status --json');
    const updateData = JSON.parse(updateOut);
    
    return NextResponse.json({
      latestVersion: updateData.availability?.latestVersion,
      updateAvailable: updateData.availability?.available,
      channel: updateData.channel?.value
    });
  } catch (error) {
    return NextResponse.json({
      latestVersion: "Unknown",
      updateAvailable: false,
      channel: "Unknown"
    });
  }
}

/**
 * POST /api/update
 * Executes 'openclaw update' on the host.
 */
export async function POST() {
  try {
    // Note: 'openclaw update' often pulls from pnpm/npm and may restart the gateway service.
    const { stdout, stderr } = await execAsync('openclaw update');
    
    return NextResponse.json({
      success: true,
      stdout: stdout || '(Update command initiated)',
      stderr: stderr || ''
    });
  } catch (error: any) {
    console.error('Update Execution Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 });
  }
}
