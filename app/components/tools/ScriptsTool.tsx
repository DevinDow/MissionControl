import React from 'react';
import { Play } from 'lucide-react';

export function ScriptsToolLeft({ scriptsTree, renderFileTree, setActiveTab }: any) {
  // Enhanced render function to inject the Execute button
  const renderScriptsWithExecute = (nodes: any[]) => {
    return nodes.map((node: any) => {
      if (node.type === 'directory') {
        return (
          <div key={node.path}>
            <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">
              {node.name}
            </div>
            <div className="ml-2 border-l border-[#1F1F1F]">
              {renderScriptsWithExecute(node.children)}
            </div>
          </div>
        );
      } else {
        return (
          <div key={node.path} className="group flex items-center gap-1 pr-2">
            <div className="flex-1 min-w-0">
              {renderFileTree([node])}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('Cmd');
                // Use a short delay to ensure the Cmd tab is rendered and the input is available
                setTimeout(() => {
                  const cmdInput = document.querySelector('input[name="command"]') as HTMLInputElement;
                  if (cmdInput) {
                    const fullPath = node.path.startsWith('/') ? node.path : `workspace/${node.path}`;
                    cmdInput.value = `python3 ${fullPath}`;
                    cmdInput.focus();
                  }
                }, 100);
              }}
              className="p-1.5 rounded bg-[#111111] border border-[#1F1F1F] text-[#555555] hover:text-[#5E6AD2] hover:border-[#5E6AD2]/30 opacity-0 group-hover:opacity-100 transition-all"
              title="Execute Script"
            >
              <Play size={12} />
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div className="space-y-1">
      {renderScriptsWithExecute(scriptsTree)}
    </div>
  );
}
