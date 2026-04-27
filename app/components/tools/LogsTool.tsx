import React, { useState } from 'react';
import { Activity, Loader2, Brain, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LogsToolLeft({ fetchData, setHealthLog, setModelHealthLog, selectedLog, setSelectedLog }: { fetchData: any, setHealthLog: any, setModelHealthLog: any, selectedLog: string, setSelectedLog: Function }) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => {
          setSelectedLog('system_health_log');
          fetchData('/api/logs?logType=system', setHealthLog, 'logs');
        }}
        className={cn(
          "w-full text-left p-3 rounded-lg border transition-all group flex items-center gap-3",
          selectedLog === 'system_health_log' ? "border-[#5E6AD2] bg-[#111111]" : "border-transparent hover:bg-[#111111]/50"
        )}
      >
        <div className={cn("p-1.5 rounded bg-[#161616] border", selectedLog === 'system_health_log' ? "border-[#5E6AD2] text-[#5E6AD2]" : "border-[#1F1F1F] text-[#8A8A8A]")}><Activity size={14} /></div>
        <span className={cn("text-[13px] font-medium", selectedLog === 'system_health_log' ? "text-[#EDEDED]" : "text-[#8A8A8A]")}>system_health_log.jsonl</span>
      </button>
      <button
        onClick={() => {
          setSelectedLog('model_health_log');
          fetchData('/api/logs?logType=model', setModelHealthLog, 'logs');
        }}
        className={cn(
          "w-full text-left p-3 rounded-lg border transition-all group flex items-center gap-3",
          selectedLog === 'model_health_log' ? "border-[#5E6AD2] bg-[#111111]" : "border-transparent hover:bg-[#111111]/50"
        )}
      >
        <div className={cn("p-1.5 rounded bg-[#161616] border", selectedLog === 'model_health_log' ? "border-[#5E6AD2] text-[#5E6AD2]" : "border-[#1F1F1F] text-[#8A8A8A]")}><Brain size={14} /></div>
        <span className={cn("text-[13px] font-medium", selectedLog === 'model_health_log' ? "text-[#EDEDED]" : "text-[#8A8A8A]")}>model_health_log.jsonl</span>
      </button>
    </div>
  );
}

export function LogsToolRight({ healthLog, modelHealthLog, loading, selectedLog }: { healthLog: string, modelHealthLog: string, loading: any, selectedLog: string }) {
  const currentLogContent = selectedLog === 'system_health_log' ? healthLog : modelHealthLog;
  const title = selectedLog === 'system_health_log' ? 'System Health Log' : 'Model Health Log';
  const logType = selectedLog === 'system_health_log' ? 'system' : 'model';
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-[#080808]">
        {loading.logs ? <Loader2 size={32} className="text-[#5E6AD2] animate-spin mx-auto mt-20" /> :
          renderHealthLogEntries(currentLogContent, 10, logType)
        }
      </div>
    </div>
  );
}

export function renderHealthLogEntries(content: string, limit: number, logType: 'system' | 'model') {
  const lines = content.split('\n').filter(line => line.trim()).reverse().slice(0, limit);
  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        try {
          const parsed = JSON.parse(line);
          let summary = '';
          if (logType === 'system') {
            summary = `${parsed.date}: ${parsed.llm_turns.total} Turns: ${parsed.llm_turns.flash} Flash + ${parsed.llm_turns.pro} Pro - ${parsed.rate_limits.model_429} 429s "${parsed.summary}"`;
          } else {
            const modelSummaries = Object.entries(parsed.models).map(([name, stats]: [string, any]) => {
              const errorCount = Object.values(stats.errors).reduce((a, b) => (a as number) + (b as number), 0) as number;
              return `${name.split('/').pop()?.replace('-preview', '')} ${stats.turns} Turns ${errorCount} Errors`;
            }).join(', ');
            summary = `${parsed.date} ${modelSummaries} "${parsed.summary}"`;
          }

          return (
            <details key={idx} className="group bg-[#0D0D0D] border rounded-lg overflow-hidden transition-all">
              <summary className="px-4 py-2 text-[11px] font-mono text-white cursor-pointer hover:bg-[#161616] flex items-center gap-2 select-none">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform text-[#5E6AD2]" />
                <span className="truncate flex-1">{summary}</span>
              </summary>
              <div className="px-4 py-3 bg-[#080808] border-t border-[#1F1F1F]">
                <pre className="text-[11px] font-mono text-white whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </div>
            </details>
          );
        } catch (e) {
          return <div key={idx} className="text-red-500 text-xs">Failed to parse log line: {line}</div>;
        }
      })}
    </div>
  );
}
