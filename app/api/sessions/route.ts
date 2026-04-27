import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionsPath } from '../../lib/paths';

const execAsync = promisify(exec);

export async function GET() {
  const reqStart = Date.now();
  console.log('[API/sessions] Request started');
  try {
    let sessionList: any[] = [];
    /* This was intentionally removed temporarily because it makes Sessions Tool very slow to load.
    Let's consider if it is worth the performance hit or if a better way can be implemented after the initial loading.
    try {
      console.log('[API/sessions] Executing "openclaw sessions --json"...');
      const cliStart = Date.now();
      const { stdout } = await execAsync('openclaw sessions --json'); // this takes 15 seconds
      console.log(`[API/sessions] CLI exec finished in ${Date.now() - cliStart}ms`);
      const start = stdout.indexOf('{');
      const end = stdout.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const cleanStdout = stdout.substring(start, end + 1);
        const data = JSON.parse(cleanStdout);
        sessionList = Array.isArray(data) ? data : data.sessions || [];
      }
    } catch (e) {
      console.warn("openclaw sessions CLI failed, falling back to file read", e);
    }*/

    /* Reading sessions.json is much faster than executing "openclaw sessions --json".
    It includes:
    - sessionId: the Filename without the extension
    - sessionFile: the full path to the session file
    - model: the model used for the session
    - inputTokens & outputTokens: the number of tokens used for the session
    */
    let sessionsJson: any = {};
    try {
      console.log('[API/sessions] Reading sessions.json...');
      const readStart = Date.now();
      const fileContent = await fs.readFile(path.join(getSessionsPath(), 'sessions.json'), 'utf8');
      sessionsJson = JSON.parse(fileContent);
      console.log(`[API/sessions] Reading sessions.json finished in ${Date.now() - readStart}ms`);
    } catch (e) {
      console.warn("Could not read sessions.json", e);
    }

    // Merge sessions JSON into the list if empty (fallback for Windows)
    if (sessionList.length === 0) {
      sessionList = Object.values(sessionsJson);
    }

    /* Enrich with session details from the session files using fs.stat()
    It adds:
    - size: size of the session file
    - updatedAt: last modified time of the session file
    - path: full path to the session file
    */
    console.log(`[API/sessions] Enriching ${sessionList.length} sessions...`);
    const enrichStart = Date.now();
    const enrichedSessions = await Promise.all(sessionList.map(async (s: any) => {
      try {
        const sessionFile = path.join(getSessionsPath(), `${s.sessionId}.jsonl`);
        const stats = await fs.stat(sessionFile);

        // Find label in sessions.json
        const jsonEntry = Object.values(sessionsJson).find((entry: any) => entry.sessionId === s.sessionId) as any;
        const label = jsonEntry?.label || (s.key === 'agent:main:main' ? 'Main Session' : s.key?.split(':')?.pop());

        //console.log(`[API/sessions] Enriching session ${label} finished in ${Date.now() - enrichStart}ms`);

        return {
          ...s,
          label,
          size: stats.size,
          updatedAt: stats.mtime.getTime(),
          path: sessionFile,
          inputTokens: jsonEntry?.inputTokens || s.inputTokens || 0,
          outputTokens: jsonEntry?.outputTokens || s.outputTokens || 0
        };
      } catch {
        return s;
      }
    }));
    console.log(`[API/sessions] Enriching sessions finished in ${Date.now() - enrichStart}ms`);

    // Filter for sessions modified today (PST)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    console.log(`[API/sessions] Filtering sessions started in ${Date.now() - reqStart}ms`);
    const filteredSessions = enrichedSessions
      .filter((s: any) => s.updatedAt && s.updatedAt >= todayTimestamp);
    console.log(`[API/sessions] Filtering sessions finished in ${Date.now() - reqStart}ms`);

    // Explicit sort by updatedAt descending
    filteredSessions.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    console.log(`[API/sessions] Sorting sessions finished in ${Date.now() - reqStart}ms`);

    // Deduplicate by sessionId to ensure unique keys in the Sessions list
    const uniqueSessions = [];
    const seenIds = new Set();
    for (const s of filteredSessions) {
      if (!seenIds.has(s.sessionId)) {
        seenIds.add(s.sessionId);
        uniqueSessions.push(s);
      }
    }

    console.log(`[API/sessions] Request completed in ${Date.now() - reqStart}ms, returning ${uniqueSessions.length} sessions`);
    return NextResponse.json(uniqueSessions);
  } catch (error) {
    console.error(`[API/sessions] Request failed after ${Date.now() - reqStart}ms:`, error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
