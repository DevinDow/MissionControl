import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get last heartbeat event from CLI
    const { stdout } = await execAsync('openclaw system heartbeat last --json');
    let last: any = null;
    try {
      last = JSON.parse(stdout);
    } catch (parseError) {
      console.warn('Could not parse heartbeat JSON from CLI stdout:', parseError);
      last = null;
    }
    if (last && typeof last === 'object' && !('ts' in last)) {
      last = null;
    }

    // Read sessions.json for lastHeartbeatText
    let lastHeartbeatText = null;
    try {
      const sessionsPath = join(process.env.HOME || '/root', '.openclaw', 'agents', 'main', 'sessions', 'sessions.json');
      const sessions = JSON.parse(readFileSync(sessionsPath, 'utf-8'));
      // Find the main session entry with the latest lastHeartbeatText
      for (const [key, session] of Object.entries(sessions)) {
        if ((session as any).lastHeartbeatText) {
          lastHeartbeatText = (session as any).lastHeartbeatText;
          break; // Use the first one found (most recent in the file)
        }
      }
    } catch (sessionsError) {
      console.warn('Could not read sessions.json for heartbeat text:', sessionsError);
    }

    return NextResponse.json({
      ts: last?.ts ?? null,
      status: last?.status ?? null,
      silent: last?.silent ?? null,
      reason: last?.reason ?? null,
      durationMs: last?.durationMs ?? null,
      channel: last?.channel ?? null,
      accountId: last?.accountId ?? null,
      indicatorType: last?.indicatorType ?? null,
      lastHeartbeatText
    });
  } catch (error) {
    console.error('Failed to fetch last heartbeat:', error);
    return NextResponse.json(null);
  }
}
