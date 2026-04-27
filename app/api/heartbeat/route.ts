import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read openclaw.json for interval and activeHours (lightweight, no CLI call)
    let interval = '?';
    let activeHours = null;
    try {
      const openclawPath = join(process.env.HOME || '/root', '.openclaw', 'openclaw.json');
      const config = JSON.parse(readFileSync(openclawPath, 'utf-8'));
      // Heartbeat config is system-wide and typically lives under agents.defaults.
      // Keep a fallback to legacy/alternate locations for compatibility.
      const heartbeatConfig =
        config.agents?.defaults?.heartbeat ??
        config.agents?.main?.heartbeat;
      if (heartbeatConfig) {
        interval = heartbeatConfig.every;
        activeHours = heartbeatConfig.activeHours;
      }
    } catch (configError) {
      console.warn('Could not read openclaw.json for heartbeat config:', configError);
    }

    return NextResponse.json({
      interval,
      activeHours
    });
  } catch (error) {
    console.error('Failed to fetch heartbeat config:', error);
    return NextResponse.json({ interval: '?', activeHours: null });
  }
}
