import { NextResponse } from 'next/server';

export async function GET() {
  const shortcuts = [
    { key: 'F5', action: 'Refresh Data' },
    { key: '/', action: 'Focus Search' },
    { key: 'Esc', action: 'Clear Selection' },
    { key: 'Ctrl+K', action: 'Command Palette (Soon)' }
  ];
  return NextResponse.json(shortcuts);
}
