import { readdir, readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { OPENCLAW_ROOT } from '../../lib/paths';

/**
 * GET /api/model
 * 
 * Finds the most recently modified session .jsonl file and extracts
 * the modelId from the last line.
 */
export async function GET() {
  try {
    const sessionsDir = join(OPENCLAW_ROOT, 'agents/main/sessions');
    
    // Read all files in the sessions directory
    const files = await readdir(sessionsDir);
    
    // Filter for .jsonl files
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    if (jsonlFiles.length === 0) {
      return NextResponse.json({ error: 'No session files found' }, { status: 404 });
    }
    
    // Find the most recently modified file
    let mostRecentFile = jsonlFiles[0];
    let mostRecentTime = (await stat(join(sessionsDir, jsonlFiles[0]))).mtime.getTime();
    
    for (const file of jsonlFiles) {
      const filePath = join(sessionsDir, file);
      const stats = await stat(filePath);
      if (stats.mtime.getTime() > mostRecentTime) {
        mostRecentTime = stats.mtime.getTime();
        mostRecentFile = file;
      }
    }
    
    // Read the file content
    const filePath = join(sessionsDir, mostRecentFile);
    const content = await readFile(filePath, 'utf8');
    
    // Split into lines and find the last occurrence of modelId
    const lines = content.trim().split('\n');
    let modelId = null;
    let provider = null;
    
    // Search from the end backwards to find the last modelId and provider
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const obj = JSON.parse(line);
        if (obj.modelId && !modelId) {
          modelId = obj.modelId;
          provider = obj.provider || null;
          break;
        }
        // Also check nested data objects (e.g., custom events with data field)
        if (obj.data && obj.data.modelId && !modelId) {
          modelId = obj.data.modelId;
          provider = obj.data.provider || null;
          break;
        }
      } catch (e) {
        // Skip malformed JSON lines
        continue;
      }
    }
    
    if (!modelId) {
      return NextResponse.json({ error: 'No modelId found in session file' }, { status: 404 });
    }
    
    // Extract the host (first part before the "/", e.g., "google/gemini-3.1-flash-lite-preview" -> "google")
    const host = modelId.includes('/') ? modelId.split('/')[0] : modelId;
    
    // Extract the model name (the part after the first "/", e.g., "google/gemini-3.1-flash-lite-preview" -> "gemini-3.1-flash-lite-preview")
    const modelName = modelId.includes('/') ? modelId.split('/').slice(1).join('/') : modelId;
    
    return NextResponse.json({
      modelId,
      provider,
      host,
      modelName,
      sessionFile: mostRecentFile
    });
  } catch (error: any) {
    console.error('Model API GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
