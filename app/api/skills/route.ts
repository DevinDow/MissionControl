import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getSkillsPath, getSystemSkillsPath } from '../../lib/paths';

export async function GET() {
  try {
    const workspaceSkillsPath = getSkillsPath();
    const systemSkillsPath = getSystemSkillsPath();

    async function getSkills(baseDir: string, origin: 'workspace' | 'system') {
      try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        const skills = await Promise.all(entries.map(async (entry) => {
          if (!entry.isDirectory()) return null;
          
          const skillDir = path.join(baseDir, entry.name);
          const metaPath = path.join(skillDir, '_meta.json');
          const readmePath = path.join(skillDir, 'SKILL.md');
          
          let meta = {};
          try {
            const metaContent = await fs.readFile(metaPath, 'utf8');
            meta = JSON.parse(metaContent);
          } catch (e) {}

          const hasReadme = await fs.access(readmePath).then(() => true).catch(() => false);

          // Get other files in skill dir (shallow)
          let fileList: any[] = [];
          try {
            const files = await fs.readdir(skillDir, { withFileTypes: true });
            fileList = files
              .filter(f => f.isFile() && f.name !== '_meta.json')
              .map(f => ({
                name: f.name,
                path: path.join(entry.name, f.name),
                fullPath: path.join(skillDir, f.name)
              }));
          } catch (e) {}

          return {
            id: `${origin}:${entry.name}`,
            name: entry.name,
            origin,
            meta,
            hasReadme,
            files: fileList,
            path: relativeSkillPath(baseDir, entry.name, origin)
          };
        }));
        return skills.filter(s => s !== null);
      } catch (e) {
        return [];
      }
    }

    function relativeSkillPath(base: string, name: string, origin: string) {
       return origin === 'workspace' ? `workspace/skills/${name}` : `system/skills/${name}`;
    }

    const [workspaceSkills, systemSkills] = await Promise.all([
      getSkills(workspaceSkillsPath, 'workspace'),
      getSkills(systemSkillsPath, 'system')
    ]);

    return NextResponse.json({
      workspace: workspaceSkills,
      system: systemSkills
    });
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return NextResponse.json({ error: 'Failed to load skills' }, { status: 500 });
  }
}
