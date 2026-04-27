import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const calendars = [
      { id: 'devindow@gmail.com', name: 'Devin' },
      { id: 'family03792519606391192921@group.calendar.google.com', name: 'Family' }
    ];
    
    const results = await Promise.all(calendars.map(async (cal) => {
      const { stdout } = await execAsync(`gog calendar events "${cal.id}" --json`);
      const data = JSON.parse(stdout);
      const events = data.events || [];
      return events.map((e: any) => ({
        ...e,
        calendarName: cal.name
      }));
    }));

    const allEvents = results.flat();
    
    // Format and sort
    const formattedEvents = allEvents.map((e: any) => ({
      id: e.id,
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location,
      status: e.status,
      calendarName: e.calendarName,
      description: e.description || "",
      creator: e.creator?.email || e.creator?.displayName || "Unknown",
      created: e.created
    })).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Failed to fetch calendar:', error);
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 500 });
  }
}
