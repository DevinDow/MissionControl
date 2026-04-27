import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath } from '../../lib/paths';

export async function GET(request: Request) {
  try {
    const workspacePath = getWorkspacePath();
    
    async function getFiles(dir: string): Promise<any[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(workspacePath, fullPath);
        
        if (entry.isDirectory()) {
          // Internal folders to always skip
          if (['node_modules', '.git', '.next', 'memory'].includes(entry.name)) return null;

          // Only allow specific script-heavy directories (blacklisting OLD)
          const isAllowedDir = entry.name === 'scripts' || 
                               entry.name === 'specs' || 
                               entry.name === 'maintenance' ||
                               dir.includes('/specs') ||
                               dir.includes('/scripts');

          if (!isAllowedDir) return null;

          const children = await getFiles(fullPath);
          if (children.length === 0) return null;

          return {
            name: entry.name,
            type: 'directory',
            path: relativePath,
            children: children
          };
        } else {
          const stats = await fs.stat(fullPath);
          const codeExts = ['.sh', '.py', '.js', '.ts', '.tsx', '.css', '.json', '.gitignore', '.env', '.html', '.yaml', '.yml'];
          const isCode = codeExts.some(ext => entry.name.endsWith(ext));
          
          if (isCode) {
            return { 
              name: entry.name, 
              type: 'file', 
              path: relativePath, 
              updatedAt: stats.mtimeMs 
            };
          }
          return null;
        }
      }));
      return files.flat().filter(f => f !== null);
    }

    const fileTree = await getFiles(workspacePath);
    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('Failed to fetch scripts:', error);
    return NextResponse.json({ error: 'Failed to load scripts' }, { status: 500 });
  }
}
