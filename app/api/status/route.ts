import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw status --json');
    const data = JSON.parse(stdout);
    return NextResponse.json(data);
  } catch (error) {
    // Return mock data for local testing environments where service isn't running natively
    return NextResponse.json({
      runtimeVersion: "Mock-Unknown",
      status: "Not Running"
    });
  }
}
