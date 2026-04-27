import { NextResponse } from 'next/server';

export async function GET() {
  const links = [
    {
      group: "Core Documentation",
      items: [
        { name: "Official Documentation", url: "https://docs.openclaw.ai/" },
        { name: "CLI Reference", url: "https://docs.openclaw.ai/cli" },
        { name: "Architecture", url: "https://docs.openclaw.ai/architecture" },
        { name: "Security Model", url: "https://docs.openclaw.ai/security" },
        { name: "Skill Spec", url: "https://docs.openclaw.ai/skills" }
      ]
    },
    {
      group: "Community",
      items: [
        { name: "ClawHub.com", url: "https://clawhub.com" },
        { name: "Discord Community", url: "https://discord.com/invite/clawd" },
        { name: "GitHub Source", url: "https://github.com/openclaw/openclaw" },
        { name: "MoltBook (Submolts)", url: "https://www.moltbook.com/m" }
      ]
    }
  ];
  return NextResponse.json(links);
}
