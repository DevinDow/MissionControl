import React from 'react';
import { ChevronRight, Folder, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CodeToolLeft({
  loading,
  setLoading,
  codeFolderData,
  setCodeFolderData,
  expandedCodeFolders,
  setExpandedCodeFolders,
  codeTree,
  setCodeTree,
  fetchData,
  matchesFilter,
  selectedFilePath,
  setSelectedFilePath,
  setSelectedSessionId,
  setSelectedTaskId,
  setSelectedEventId
}: any) {
  // Ensure we fetch code tree on mount if empty
  React.useEffect(() => {
    if (codeTree && codeTree.length === 0) {
      fetchData('/api/code', setCodeTree, 'code');
    }
  }, []);

  const fetchCodeFolder = async (folderPath: string) => {
    // Toggle expand/collapse
    if (expandedCodeFolders.has(folderPath)) {
      setExpandedCodeFolders((prev: any) => {
        const next = new Set(prev);
        next.delete(folderPath);
        return next;
      });
      return;
    }
    
    // Mark as expanded
    setExpandedCodeFolders((prev: any) => new Set(prev).add(folderPath));
    
    // Fetch if not loaded
    if (!codeFolderData[folderPath]) {
      setLoading((prev: any) => ({ ...prev, code: true }));
      try {
        const res = await fetch(`/api/code?path=${encodeURIComponent(folderPath)}`);
        const data = await res.json();
        setCodeFolderData((prev: any) => ({ ...prev, [folderPath]: data }));
      } catch (e) {
        console.error('Failed to load code folder:', e);
      } finally {
        setLoading((prev: any) => ({ ...prev, code: false }));
      }
    }
  };

  const renderCodeTree = (nodes: any[], depth = 0): any => {
    return nodes.map((node) => {
      const paddingLeft = `${(depth * 12) + 8}px`;

      if (node.type === 'directory') {
        const isExpanded = expandedCodeFolders.has(node.path);
        const children = codeFolderData[node.path] || [];

        return (
          <div key={node.path}>
            <button
              onClick={() => fetchCodeFolder(node.path)}
              style={{ paddingLeft }}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 text-[12px] transition-all hover:bg-[#111111]/50 group",
                isExpanded ? "text-[#5E6AD2] font-bold" : "text-[#8A8A8A] hover:text-[#EDEDED]"
              )}
            >
              <ChevronRight size={14} className={cn("transition-transform", isExpanded ? "rotate-90 text-[#5E6AD2]" : "text-[#666666]")} />
              <Folder size={12} className={isExpanded ? "text-[#5E6AD2]" : "text-[#666666] group-hover:text-[#8A8A8A]"} />
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded && children.length > 0 && (
              <div>
                {renderCodeTree(children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        if (!matchesFilter(node.name)) return null;
        return (
          <button
            key={node.path}
            onClick={() => { setSelectedFilePath(node.path); setSelectedSessionId(null); setSelectedTaskId(null); setSelectedEventId(null); }}
            style={{ paddingLeft: `${(depth * 12) + 24}px` }}
            className={cn(
              "w-full text-left py-1.5 pr-2 text-[12px] transition-all flex items-center gap-2 group",
              selectedFilePath === node.path
                ? "bg-[#111111] text-white"
                : "text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#111111]/50"
            )}
          >
            <FileText size={12} className={cn(
              "shrink-0 transition-colors",
              selectedFilePath === node.path ? "text-[#5E6AD2]" : "text-[#666666] group-hover:text-[#8A8A8A]"
            )} />
            <span className="truncate flex-1">{node.name}</span>
            {node.size && <span className="text-[9px] text-[#555555] font-mono shrink-0">{(node.size / 1024).toFixed(1)} KB</span>}
          </button>
        );
      }
    });
  };

  return (
    <div className="space-y-1 pr-2">
      {loading.code && Object.keys(codeFolderData).length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="text-[#5E6AD2] animate-spin" />
        </div>
      ) : (
        renderCodeTree(codeTree)
      )}
    </div>
  );
}
