import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { OPENCLAW_ROOT } from '../../lib/paths';

export async function GET() {
  try {
    // Read openclaw.json for interval and activeHours (lightweight, no CLI call)
    let interval = '?';
    let activeHours = null;
    try {
      const configPath = path.join(OPENCLAW_ROOT, 'openclaw.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      const openclawConfig = JSON.parse(configData);

      // Heartbeat config is system-wide and typically lives under agents.defaults.
      // Keep a fallback to legacy/alternate locations for compatibility.
      const heartbeatConfig =
        openclawConfig.agents?.defaults?.heartbeat ??
        openclawConfig.agents?.main?.heartbeat;
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
