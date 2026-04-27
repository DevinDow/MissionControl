import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const spreadsheetId = '1lbOmvqJv_R6T3AAEMNOiGroFTG9xj8jTRHGfuJrZfeo';
    // Expanding range to include all relevant columns
    const range = 'TODO!A1:I50';
    const { stdout } = await execAsync(`gog sheets get ${spreadsheetId} "${range}" --json`);
    const data = JSON.parse(stdout);
    const values = data.values;
    
    if (!values || values.length < 2) return NextResponse.json([]);

    const headers = values[0];
    const rows = values.slice(1);

    const tasks = rows.map((row: any[], index: number) => {
      const task: any = { id: `task-${index}` };
      headers.forEach((header: string, i: number) => {
        if (header) {
          // Normalize header name to lowercase
          const key = header.toLowerCase();
          task[key] = row[i] || "";
        }
      });
      return task;
    }).filter((t: any) => t["task name"]); // Filter out empty lines

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}
