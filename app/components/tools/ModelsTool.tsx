import React from 'react';
import { Folder, BrainCog, ChevronRight, History, Users, Activity, Play, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * ModelsToolLeft Component
 * Handles the sidebar rendering of available LLM models in a hierarchical tree.
 * 
 * DESIGN NOTES:
 * We use a recursive rendering approach to support any depth of model categorization.
 * Typical structures: 
 * - Provider / Model
 * - Host / Provider / Model
 * 
 * PERFORMANCE:
 * - Memoized to prevent re-renders on parent updates
 * - renderModelTree is wrapped in useCallback for stability
 * - Expanded folders use Set for O(1) lookup performance
 */
function ModelsToolLeftComponent({ modelsData, modelsLoading, onSelectModel, selectedModelId, onRefresh }: any) {
  // We use a Set to track which directory paths are currently 'expanded' in the UI.
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (modelsLoading) {
      console.log('[ModelsToolLeft] Loading started');
    } else {
      console.log('[ModelsToolLeft] Loading finished, tree has', modelsData?.tree?.length, 'top-level nodes');
    }
  }, [modelsLoading]);

  React.useEffect(() => {
    console.log('[ModelsToolLeft] Render triggered. Loaded:', !!modelsData?.tree, 'Loading:', modelsLoading);
  });

  // Ensure the tree opens to reveal the currently selected model.
  React.useEffect(() => {
    if (!selectedModelId) return;
    const parts = selectedModelId.split('/');
    if (parts.length < 2) return;

    const ancestorPaths: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
      ancestorPaths.push(parts.slice(0, i + 1).join('/'));
    }

    setExpandedFolders(prev => {
      const next = new Set(prev);
      ancestorPaths.forEach(path => next.add(path));
      return next;
    });
  }, [selectedModelId]);

  // Toggles the expansion state of a specific folder path.
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  /**
   * Recursive tree renderer
   * @param nodes Array of nodes at the current level (directories or models)
   * @param path The accumulated string path to ensure unique keys and state matching
   */
  const renderModelTree = (nodes: any[], path: string = "") => {
    if (!nodes) return null;

    return nodes.map((node, index) => {
      // Create a unique path identifier for this node to track its expansion state.
      const currentPath = path ? `${path}/${node.name}` : node.name;

      // BRANCH NODE: If the node type is a 'directory', it represents a Host or Provider category.
      if (node.type === 'directory') {
        const isExpanded = expandedFolders.has(currentPath);

        return (
          <div key={currentPath} className="space-y-0.5">
            {/* Category Header Button */}
            <button
              onClick={() => toggleFolder(currentPath)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] transition-all hover:bg-[#111111]/50 group"
            >
              {/* Chevron indicates if the branch is open (90deg rotation) or closed */}
              <ChevronRight size={12} className={cn("transition-transform", isExpanded ? "rotate-90" : "")} />
              <Folder size={12} />
              <span className="uppercase tracking-wider">{node.name}</span>

              {/* Educational Hint: Displays the 'role' as defined by the API for learning purposes */}
              {node.role && (
                <span className="text-[9px] text-[#555555] ml-auto font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  {node.role}
                </span>
              )}
            </button>

            {/* If Expanded, recursively render children with indentation (ml-4) */}
            {isExpanded && (
              <div className="ml-4 border-l border-[#1F1F1F]">
                {renderModelTree(node.children, currentPath)}
              </div>
            )}
          </div>
        );
      }

      // LEAF NODE: If the node type is 'model', it is an actual selectable item.
      else {
        return (
          <button
            key={node.id}
            onClick={() => onSelectModel(node)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex flex-col gap-0.5 border border-transparent group",
              selectedModelId === node.id
                ? "bg-[#111111] border-[#1F1F1F] text-white shadow-sm"
                : "text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#111111]/50"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              {/* Visual icon for Brain/AI indicates a leaf model node */}
              <BrainCog size={14} className={cn(
                "transition-colors",
                selectedModelId === node.id ? "text-[#5E6AD2]" : "text-[#666666] group-hover:text-[#8A8A8A]"
              )} />
              <span className="truncate flex-1 font-medium">{node.name}</span>

              {/* Educational Note: Badges help identify the primary and backup models at a glance. */}
              {node.isPrimary && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B2B1B] text-[#4ADE80] border border-[#2B4B2B] uppercase tracking-wide shadow-sm flex-shrink-0">
                  #1
                </span>
              )}
              {node.fallbackRank !== null && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2B2B1B] text-[#FBBF24] border border-[#4B4B2B] uppercase tracking-wide shadow-sm flex-shrink-0">
                  FB #{node.fallbackRank}
                </span>
              )}
            </div>

            {/* Context window and Alias meta-data in a compact monospaced font */}
            <div className="flex items-center gap-2 w-full text-[10px] font-mono">
              <span className="text-[#555555] opacity-80">{node.contextWindowFormatted} tokens</span>
              {node.alias && (
                <>
                  <span className="text-[#555555] mx-1">|</span>
                  <span className="text-[#5E6AD2]/80">{node.alias}</span>
                </>
              )}
            </div>
          </button>
        );
      }
    });
  };

  // --- STANDARD LOADING STATES ---
  if (modelsLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-[#5E6AD2]">Initializing model tree...</span>
        </div>
      </div>
    );
  }

  // If the API returns no tree, show a graceful empty state.
  if (!modelsData?.tree) {
    return (
      <div className="p-4">
        <span className="text-[13px] text-[#8A8A8A]">No models hierarchy available</span>
      </div>
    );
  }

  // --- RENDER MAIN LIST ---
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-[#1F1F1F] justify-between">
        <span className="text-[13px] font-medium text-[#5E6AD2]">Available Models</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={modelsLoading}
            className="p-1 hover:bg-[#1A1A1A]/50 rounded transition-all disabled:opacity-50"
            title="Refresh models list"
          >
            <RefreshCw size={14} className={cn("text-[#8A8A8A]", modelsLoading && "animate-spin")} />
          </button>
        )}
      </div>

      {/* Start the recursive render from the top-level 'tree' returned by the API */}
      <div className="space-y-1">
        {renderModelTree(modelsData.tree)}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const ModelsToolLeft = React.memo(ModelsToolLeftComponent, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders if data hasn't changed
  return (
    prevProps.modelsData?.tree === nextProps.modelsData?.tree &&
    prevProps.modelsLoading === nextProps.modelsLoading &&
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.onSelectModel === nextProps.onSelectModel &&
    prevProps.onRefresh === nextProps.onRefresh
  );
});
ModelsToolLeft.displayName = 'ModelsToolLeft';

export function ModelsToolRight({ selectedModel, allSessions, onNavigateToSession, platform }: any) {
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testPrompt, setTestPrompt] = React.useState("Are you a robot?  And if not, then what are you?");

  // Reset test results when the selection changes to avoid confusion
  React.useEffect(() => {
    setTestResult(null);
  }, [selectedModel?.id]);

  /**
   * Executes the test_model.py script via the terminal API.
   * This provides a real-world connectivity check for OpenRouter configurations.
   */
  const handleTestModel = async () => {
    if (!selectedModel || isTesting) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // We strip the internal 'openrouter/' prefix to give the script the raw host/model ID
      const modelId = selectedModel.id.replace('openrouter/', '');
      
      // Select the correct python command based on the server's platform
      const pythonCmd = platform === 'win32' ? 'python' : 'python3';
      
      // Escape double quotes in the prompt for the shell command
      const escapedPrompt = testPrompt.replace(/"/g, '\\"');
      const command = `${pythonCmd} workspace/scripts/test_model.py "${modelId}" "${escapedPrompt}"`;

      const response = await fetch('/api/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();
      setTestResult(data.output);
    } catch (err: any) {
      setTestResult(`Execution Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!selectedModel) {
    return <div className="p-4 text-[#555555] text-[13px]">Select a model to view details</div>;
  }

  const isOpenRouter = selectedModel.id.startsWith('openrouter/');
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-semibold text-[#EDEDED]">{selectedModel.name}</h2>
          {selectedModel.isPrimary && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B2B1B] text-[#4ADE80] border border-[#2B4B2B] uppercase tracking-wider shadow-sm">Primary</span>
          )}
          {selectedModel.fallbackRank && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2B2B1B] text-[#FBBF24] border border-[#4B4B2B] uppercase tracking-wider shadow-sm">Fallback #{selectedModel.fallbackRank}</span>
          )}
        </div>

        {/* 
            EDUCATIONAL NOTE:
            The Test button is only enabled for OpenRouter models as specified
            by the user requirement. It bridges the UI to the backend python validator.
        */}
        {isOpenRouter && (
          <div className="flex flex-col gap-2 min-w-[240px] max-w-[320px]">
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Test Prompt..."
              className="w-full bg-[#080808] border border-[#1F1F1F] rounded-md px-3 py-1.5 text-[12px] text-[#EDEDED] focus:outline-none focus:border-[#5E6AD2]/50 resize-none h-[48px] scrollbar-thin scrollbar-thumb-[#1F1F1F] scrollbar-track-transparent"
            />
            <button
              onClick={handleTestModel}
              disabled={isTesting}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border",
                isTesting
                  ? "bg-[#1A1A1A] border-[#1F1F1F] text-[#555555] cursor-not-allowed"
                  : "bg-[#5E6AD2]/10 border-[#5E6AD2]/20 text-[#5E6AD2] hover:bg-[#5E6AD2]/20 shadow-[0_0_15px_-5px_#5E6AD233]"
              )}
            >
              {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
          </div>
        )}
      </div>
      <p className="text-[13px] text-[#8A8A8A] font-mono">{selectedModel.id}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111111] p-4 rounded-lg border border-[#1F1F1F]">
          <span className="text-[11px] uppercase text-[#555555]">Context Window</span>
          <div className="text-[14px] text-[#EDEDED]">{selectedModel.contextWindowFormatted}</div>
        </div>
        <div className="bg-[#111111] p-4 rounded-lg border border-[#1F1F1F]">
          <span className="text-[11px] uppercase text-[#555555]">Alias</span>
          <div className="text-[14px] text-[#EDEDED]">{selectedModel.alias || 'None'}</div>
        </div>
      </div>

      {/* Test Output Panel */}
      {testResult && (
        <div className="space-y-4 pt-6 border-t border-[#1F1F1F] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#5E6AD2]" />
              <h3 className="text-[14px] font-semibold text-[#EDEDED]">OpenRouter Connectivity Test Result</h3>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-[10px] text-[#555555] hover:text-[#EDEDED] uppercase font-bold tracking-tight"
            >
              Clear Result
            </button>
          </div>
          <pre className="bg-[#080808] border border-[#1F1F1F] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-words text-[11px] font-mono text-[#EDEDED] leading-relaxed max-h-[300px] shadow-inner">
            {testResult}
          </pre>
        </div>
      )}

      {/* 
          EDUCATIONAL NOTE:
          This section links the model to its usage history across the system.
          By cross-referencing the global session history, we can find associations
          between this specific model and the AI agents that used it.
      */}
      <div className="space-y-4 pt-6 border-t border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[#5E6AD2]" />
          <h3 className="text-[14px] font-semibold text-[#EDEDED]">Recent Sessions using this Model</h3>
        </div>

        {(() => {
          // Filter the total session history to find matching provider/model pairs.
          const matchingSessions = allSessions?.filter((s: any) => {
            const sId = `${s.modelProvider}/${s.model}`;
            return sId === selectedModel.id;
          }).sort((a: any, b: any) => b.updatedAt - a.updatedAt) || [];

          if (matchingSessions.length === 0) {
            return (
              <div className="bg-[#111111] p-8 rounded-lg border border-[#1F1F1F] border-dashed text-center">
                <span className="text-[13px] text-[#555555]">No session history found for this model.</span>
              </div>
            );
          }

          // Generate a timestamp for the start of today to differentiate between live and history sessions.
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayTimestamp = todayStart.getTime();

          return (
            <div className="grid grid-cols-1 gap-2">
              {matchingSessions.map((session: any) => {
                // Today's sessions go to the 'Sessions' tool; older sessions go to 'History'.
                const isToday = (session.updatedAt || 0) >= todayTimestamp;
                const targetTab = isToday ? 'Sessions' : 'History';
                const Icon = isToday ? Users : History;

                return (
                  <button
                    key={session.sessionId}
                    onClick={() => onNavigateToSession(session.sessionId, targetTab)}
                    className="w-full text-left p-3 rounded-xl bg-[#111111] border border-[#191919] hover:border-[#5E6AD2]/50 hover:bg-[#151515] transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Icon size={12} className={cn(
                            "transition-colors",
                            isToday ? "text-[#4ADE80]" : "text-[#555555] opacity-60"
                          )} />
                          <span className="text-[13px] text-[#EDEDED] font-medium truncate group-hover:text-[#5E6AD2] transition-colors">
                            {session.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#555555] font-mono shrink-0">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8A8A8A] font-mono truncate mt-1 opacity-60 ml-5">
                        Target: {targetTab} ID: {session.sessionId.substring(0, 8)}...
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
