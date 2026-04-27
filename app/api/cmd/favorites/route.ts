import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getFavoritesPath } from '../../../lib/paths';

const FAVORITES_FILE = getFavoritesPath();

async function getFavorites() {
  try {
    const data = await fs.readFile(FAVORITES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read favorites:', error);
    return [];
  }
}

export async function GET() {
  const favorites = await getFavorites();
  return NextResponse.json(favorites);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const favorites = await getFavorites();

    if (body.action === 'add') {
      if (!favorites.includes(body.command)) {
        favorites.push(body.command);
      }
    } else if (body.action === 'remove') {
      const index = favorites.indexOf(body.command);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    }

    await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8');
    return NextResponse.json(favorites);
  } catch (error: any) {
    console.error('Failed to update favorites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
