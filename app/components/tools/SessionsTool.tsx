import React, { useState } from 'react';
import { Clock, MessagesSquare, Loader2, History, Search, ChevronRight, AlertCircle, RefreshCw, BrainCog } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, formatSessionTime } from './utils/dateFormatting';

const formatTokens = (num: number | undefined) => {
  if (!num) return 0;
  return num >= 1000 ? Math.round(num / 1000) + 'k' : num;
};

export function SessionsToolLeft({ sessions, matchesFilter, selectedSessionId, setSelectedSessionId, setSelectedFilePath, setSelectedTaskId, setSelectedEventId, setHistoryLimit, setSessionSearch, handleRefresh, isRefreshing }: any) {
  return (
    <>
      {handleRefresh && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full flex items-center justify-center gap-2 p-2 mb-2 rounded-lg border border-[#1F1F1F] bg-[#111111] hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed text-[#8A8A8A] hover:text-[#EDEDED] transition-all text-xs font-medium focus:outline-none"
        >
          <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
          Refresh List
        </button>
      )}
      {(sessions || []).filter((s: any) => matchesFilter(s.fileId || s.sessionId || s.label)).map((session: any, idx: number) => {
        // Prefer fileId so historical entries like .jsonl.reset/.deleted remain addressable.
        const id = session.fileId || session.sessionId;
        const isMain = session.key?.endsWith(':main');
        const isCron = session.kind === 'cron' || session.key?.includes(':cron:');
        const isGoogleCli = session.modelProvider === 'google-gemini-cli';
        const isOpenRouter = session.modelProvider === 'openrouter';
        const ageMs = Date.now() - session.updatedAt;
        const isRecent = ageMs < 3600000; // 60 mins

        const isReset = session.isReset;
        const isDeleted = session.isDeleted;
        const isArchive = session.isArchive;

        return (
          <button
            key={`${id}-${idx}`}
            onClick={() => { setSelectedSessionId(id); setSelectedFilePath(null); setSelectedTaskId(null); setSelectedEventId(null); setHistoryLimit(10); setSessionSearch(''); }}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all group",
              selectedSessionId === id ? "bg-[#111111] border-[#1F1F1F]" : "border-transparent hover:bg-[#111111]/50",
              isReset && "border-l-4 border-l-blue-600/50",
              isDeleted && "border-l-4 border-l-red-600/50",
              isArchive && "border-l-4 border-l-yellow-600/50"
            )}
          >
            <div className="flex items-center justify-between gap-4" suppressHydrationWarning>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isMain ? (
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isRecent
                      ? "bg-green-500 shadow-[0_0_5px_#22C55E] animate-pulse"
                      : "bg-yellow-500 shadow-[0_0_5px_#EAB308] animate-[pulse_3s_ease-in-out_infinite]"
                  )} />
                ) : isCron ? (
                  <Clock size={14} className="text-[#5E6AD2] shrink-0" />
                ) : (
                  <MessagesSquare size={14} className="text-[#5E6AD2]/60 shrink-0" />
                )}
                <span className="text-[13px] font-medium break-words whitespace-pre-wrap leading-tight">{session.label || 'Unnamed Session'}</span>
                {isReset && <span className="text-[9px] bg-blue-900/40 text-blue-400 px-1 rounded font-bold border border-blue-700/50">RESET</span>}
                {isDeleted && <span className="text-[9px] bg-red-900/40 text-red-400 px-1 rounded font-bold border border-red-700/50">DELETED</span>}
                {isArchive && <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1 rounded font-bold border border-yellow-700/50">ARCHIVE</span>}
              </div>
              {(() => {
                const { text, color } = formatRelativeTime(session.updatedAt);
                return (
                  <span className={cn("text-[10px] font-mono shrink-0 self-start mt-0.5", color)} suppressHydrationWarning>
                    {text}
                  </span>
                );
              })()}
            </div>
            {session.key?.split(':').pop() && session.key?.split(':').pop() !== 'unknown' && (
              <div className="text-[10px] text-[#5E6AD2]/60 mt-1 ml-5 font-mono break-all whitespace-pre-wrap leading-tight">
                session: {session.key.split(':').pop()}
              </div>
            )}
            <div className="text-[10px] text-[#5E6AD2]/60 mt-1 ml-5 font-mono break-all whitespace-pre-wrap leading-tight">
              file: {id}
            </div>
            <div className="text-[10px] ml-5 font-mono break-all whitespace-pre-wrap leading-tight">
              <span className={cn(
                "text-[10px] font-mono break-all whitespace-pre-wrap leading-tight",
                isGoogleCli ? "text-[#5E6AD2]/80 font-bold" : isOpenRouter ? "text-[#2ADE20]/80 font-bold" : "text-[#8A8A8A]"
              )}>{session.modelProvider}/{session.model}</span>
              {(session.inputTokens || session.outputTokens) ? (
                <span className="ml-1 text-[#5E6AD2]/60 whitespace-nowrap">in: {formatTokens(session.inputTokens)} out: {formatTokens(session.outputTokens)}</span>
              ) : null}
            </div>
          </button>
        );
      })}
    </>
  );
}

export function SessionsToolRight({ selectedSession, loading, fileContent, contentError, historyLimit, setHistoryLimit, sessionSearch, setSessionSearch, sessionStale, sessionNewLineCount, handleRefreshSession, activeTab, onNavigateToModel }: any) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom when "ALL" rows are loaded
  React.useEffect(() => {
    if (historyLimit >= 1000000 && scrollContainerRef.current) {
      // Small timeout to ensure the DOM has updated with all rows
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [historyLimit]);

  // Uses Regex to wrap search matches in a high-visibility <mark> tag
  const highlightMatches = (content: any, search: string): any => {
    if (!search || !content) return content;
    if (typeof content === 'string') {
      const parts = content.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase()
          ? <mark key={i} data-search-match="true" className="bg-[#FFFF00] text-[#5E6AD2] opacity-100 font-black rounded-sm px-0.5">{part}</mark>
          : part
      );
    }
    if (Array.isArray(content)) {
      return content.map((child, i) => <React.Fragment key={i}>{highlightMatches(child, search)}</React.Fragment>);
    }
    return content;
  };

  const allLines = (fileContent || '').split('\n').filter(line => line.trim()).reverse();
  const totalRows = allLines.length;
  const filteredLines = sessionSearch
    ? allLines.filter(line => line.toLowerCase().includes(sessionSearch.toLowerCase()))
    : allLines;
  const filteredRows = filteredLines.length;
  const visibleRows = Math.min(historyLimit, filteredRows);
  const selectedSessionModelId = selectedSession?.modelProvider && selectedSession?.model
    ? `${selectedSession.modelProvider}/${selectedSession.model}`
    : null;

  const renderLogEntries = (linesToRender: string[], search: string) => {
    const cleanText = (text: string): string => {
      const MAX_LINE_LENGTH = 200;
      let content = text
        .replace(/<<<[\s\S]*?>>>/g, '')
        .replace(/\n+/g, '\n')
        .split('\n')
        .slice(0, 20)
        .map(line => line.length > MAX_LINE_LENGTH ? line.substring(0, MAX_LINE_LENGTH) + '...' : line)
        .join('\n');

        return content;
    }

    const renderSingleEntry = (line: string, globalIdx: number) => {
      try {
        const parsed = JSON.parse(line);
        const entryKey = `${parsed.timestamp}-${globalIdx}`;

        // HEADER
        let header = parsed.type || 'Unknown Type';
        header += ' - ';

        // ERROR
        var error: string = "";
        if (parsed.data?.error)
          error += parsed.data.error;

        // SUMMARY
        let summary: string = "";

        if (parsed.data?.model)
          summary += parsed.data.model;
        else if (parsed.data?.modelId)
          summary += parsed.data.modelId;

        if (parsed.customType)
          header += parsed.customType;

        if (parsed.type === 'thinking_level_change') {
          if (parsed.thinkingLevel)
            summary += `New Thinking Level: ${parsed.thinkingLevel}`;
          else
            summary += `${JSON.stringify(parsed.data)}`;
        }

        // message
        if (parsed.message) {
          // HEADER
          if (parsed.message.role)
            header += parsed.message.role + ' ';
          if (parsed.message.toolName)
            header += parsed.message.toolName + ' ';
          if (parsed.message.model)
            header += parsed.message.model + ' ';

          // ERROR
          if (parsed.message.errorMessage)
            error += parsed.message.errorMessage;

          // SUMMARY
          if (parsed.message.content) {
            if (typeof parsed.message.content === 'string') {
              summary += `MESSAGE CONTENT: ${cleanText(parsed.message.content)}`;
            } else if (Array.isArray(parsed.message.content)) {
              parsed.message.content.forEach((block: any) => {
                if (summary.length > 0) {
                  summary += '\n\n';
                }

                // TEXT
                if (block.text) {
                  summary += `TEXT: ${cleanText(block.text)}`;
                }

                // TOOLCALL
                else if (block.type === 'toolCall') {
                  summary += `TOOL CALL: `;
                  if (block.name) {
                    summary += `${block.name} `;
                  }
                  if (block.arguments?.path) {
                    summary += `${block.arguments.path}`;
                  }
                  if (block.arguments?.url) {
                    summary += `${block.arguments.url}`;
                  }
                  if (block.arguments?.command) {
                    summary += `${block.arguments.command}`;
                  }
                  if (block.arguments?.content) {
                    summary += `${block.arguments.content}`;
                  }
                }

                // THINKING
                else if (block.type === 'thinking') {
                  summary += `THINKING: `;
                  if (block.thinking) {
                    summary += `${cleanText(block.thinking)}`;
                  }
                }

                // DEFAULT JSON
                else {
                  summary += `${cleanText(JSON.stringify(block))}`;
                }
              });
            } else
              summary += `${JSON.stringify(parsed.message)}`;

            // append USAGE & DETAILS after the rest
            if (parsed.message.usage)
              summary += `\n\nUSAGE: ${cleanText(JSON.stringify(parsed.message.usage))}`;
            if (parsed.message.details)
              summary += `\n\nDETAILS: ${cleanText(JSON.stringify(parsed.message.details))}`;
          }
        }

        return (
          <details key={entryKey} className="group bg-[#0D0D0D] border border-[#1F1F1F] rounded-lg overflow-hidden transition-all">
            <summary className="px-4 py-2 text-[11px] font-mono text-white cursor-pointer hover:bg-[#161616] flex flex-col gap-1.5 select-none relative">
              <div className="flex items-center gap-2 w-full">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform text-[#5E6AD2] shrink-0" />
                <span className="text-[#5E6AD2] font-bold shrink-0">{header}</span>
                <span className="text-[#FF8A8A] font-bold shrink-0">{error}</span>
                <div className="flex-1" />
                {(() => {
                  const { text, color } = formatSessionTime(parsed.timestamp ? new Date(parsed.timestamp).getTime() : 0);
                  return (
                    <span className={cn('text-[10px] font-bold shrink-0', color)} suppressHydrationWarning>
                      {parsed.timestamp ? text : ''}
                    </span>
                  );
                })()}
              </div>
              <div className="pl-5 pr-2 text-white leading-snug whitespace-pre-wrap">
                {highlightMatches(summary || line, search)}
              </div>
            </summary>
            <div className="px-4 py-3 bg-[#080808] border-t border-[#1F1F1F]">
              <pre className="text-[11px] font-mono text-white whitespace-pre-wrap leading-relaxed">
                {highlightMatches(JSON.stringify(parsed, null, 2), search)}
              </pre>
            </div>
          </details>
        );
      } catch (e) {
        return (
          <div key={`raw-${globalIdx}`} className="px-4 py-2 text-[11px] font-mono bg-[#0D0D0D] border border-[#1F1F1F] rounded-lg italic text-[#666666]">
            {highlightMatches(line, search)}
          </div>
        );
      }
    };

    return (
      <div className="space-y-2">
        {linesToRender.map((line, idx) => renderSingleEntry(line, idx))}
      </div>
    );
  };

  if (!selectedSession) return <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[#555555] italic">Select a session to view logs</div>;

  if (contentError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[#555555]">
        <AlertCircle className="mx-auto text-red-500/50 mb-4" size={32} />
        <div className="text-red-400 font-bold mb-2">Error Loading Session</div>
        <div className="text-sm text-[#8A8A8A] font-mono whitespace-pre-wrap">{contentError}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#1F1F1F] bg-[#0D0D0D] space-y-4">
        {/* Row 1: Session name + fileId (own row) */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
          <h2 className="text-lg font-semibold text-white leading-tight break-words min-w-0">
            {selectedSession?.label || (activeTab === 'History' ? 'Historical Log' : 'Unnamed Session')}
          </h2>
          {selectedSession.fileId ? (
            <span
              className="text-[11px] font-mono text-[#5E6AD2]/90 shrink-0 max-w-full truncate"
              title={selectedSession.fileId}
            >
              File ID: {selectedSession.fileId}
            </span>
          ) : selectedSession.sessionId ? (
            <span
              className="text-[11px] font-mono text-[#5E6AD2]/90 shrink-0 max-w-full truncate"
              title={selectedSession.sessionId}
            >
              Session ID: {selectedSession.sessionId}
            </span>
          ) : null}
        </div>

        {/* Row 2: Model, refresh, size, updated */}
        <div className="flex flex-wrap items-center justify-end gap-4">
          {selectedSessionModelId && (
            <button
              onClick={() => onNavigateToModel?.(selectedSessionModelId)}
              className="group relative px-2.5 py-1.5 rounded flex items-center gap-2 transition-all border bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2] hover:bg-[#5E6AD2]/20 hover:text-white"
              title={`View ${selectedSessionModelId} in Models`}
            >
              <BrainCog size={14} />
              <span className="text-[10px] font-bold uppercase tracking-tight max-w-[220px] truncate">
                {selectedSessionModelId}
              </span>
            </button>
          )}
          <button
            onClick={handleRefreshSession}
            className={cn(
              "group relative px-2.5 py-1.5 rounded flex items-center gap-2 transition-all border",
              sessionStale
                ? "bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2] shadow-[0_0_15px_rgba(94,106,210,0.1)]"
                : "bg-transparent border-transparent hover:bg-[#1F1F1F] text-[#555555] hover:text-[#EDEDED]"
            )}
            title={sessionStale ? "New activity detected! Refresh now." : "Refresh history"}
          >
            <History size={16} className={cn(sessionStale && "text-[#5E6AD2]")} />
            {sessionStale && (
              <span className="text-[10px] font-bold tracking-tight">
                {sessionNewLineCount > 0 ? `+${sessionNewLineCount} NEW` : 'REFRESH'}
              </span>
            )}
            {sessionStale && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#5E6AD2] rounded-full border-2 border-[#0D0D0D] animate-pulse" />
            )}
          </button>
          {selectedSession?.size && <div className="text-[10px] text-[#555555] font-bold uppercase tracking-wider">Size: {(selectedSession.size / 1024).toFixed(1)} KB</div>}
          <div className="text-[10px] text-[#555555] font-bold uppercase tracking-wider" suppressHydrationWarning>Updated: {new Date(selectedSession?.updatedAt || 0).toLocaleString()}</div>
        </div>

        {/* Row 3: Search and Row Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder="Search in session history..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full bg-[#111111] border border-[#1F1F1F] rounded px-8 py-1.5 text-[11px] text-[#EDEDED] focus:outline-none focus:border-[#5E6AD2]/50 placeholder:text-[#444444]"
            />
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#555555] bg-[#111111] border border-[#1F1F1F] px-3 py-1.5 rounded self-stretch whitespace-nowrap">
            <span className="text-[#8A8A8A]">Showing</span>
            <select
              value={historyLimit >= totalRows ? 'all' : historyLimit}
              onChange={(e) => {
                const val = e.target.value;
                setHistoryLimit(val === 'all' ? 1000000 : parseInt(val));
              }}
              className="bg-transparent text-[#EDEDED] focus:outline-none cursor-pointer hover:text-white transition-colors"
            >
              {Array.from({ length: Math.floor((totalRows - 1) / 10) }, (_, i) => (i + 1) * 10).map(val => (
                <option key={val} value={val} className="bg-[#111111]">{val}</option>
              ))}
              <option value="all" className="bg-[#111111]">ALL</option>
            </select>
            <span className="text-[#333333]">/</span>
            <button
              onClick={() => setHistoryLimit(1000000)}
              className="text-[#5E6AD2] hover:text-white transition-colors flex items-center gap-1"
              title="Click to load all rows"
            >
              {totalRows} <span className="text-[#555555]">Entries</span>
            </button>
            {sessionSearch && filteredRows !== totalRows && (
              <span className="ml-2 pl-2 border-l border-[#1F1F1F] text-[#EAB308]/60">
                {filteredRows} matches
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 bg-[#080808] space-y-6"
      >
        <div className="space-y-4 pb-20">
          {loading.content ? <Loader2 size={32} className="text-[#5E6AD2] animate-spin mx-auto" /> :
            contentError ? (
              <div className="p-8 text-center bg-[#111111] rounded-lg border border-dashed border-red-500/30">
                <AlertCircle className="mx-auto text-red-500/50 mb-2" />
                <div className="text-red-400 font-bold mb-1">Could not load session</div>
                <div className="text-xs text-[#8A8A8A] font-mono">{contentError}</div>
              </div>
            ) : renderLogEntries(filteredLines.slice(0, historyLimit), sessionSearch)
          }
        </div>
      </div>
    </div>
  );
}
