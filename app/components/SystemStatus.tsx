"use client";

import React, { useState } from 'react';
import { Users, Clock, ArrowUpCircle, Loader2, Heart, GitBranch, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

export function SystemStatus({ 
  gatewayStatus,
  sessions,
  jobs,
  gitStatus,
  modelStatus,
  updating,
  setUpdating,
  isMounted,
  onNavigateToHeartbeat,
  onNavigateToSessions,
  onNavigateToJobs,
  onNavigateToModel,
  onNavigateToGit
}: any) {
  const [heartbeatTooltip, setHeartbeatTooltip] = useState(false);

  // Format relative time for heartbeat
  const formatHeartbeatTime = (ts: number) => {
    const now = Date.now();
    const diffMs = now - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Parse interval string for compact display (e.g., "3h" -> "3h")
  const formatInterval = (interval: string) => {
    if (!interval || interval === '?') return 'unknown';
    const match = interval.match(/(\d+)([hmd])/);
    if (!match) return interval;
    const [, num, unit] = match;
    return `${num}${unit}`;
  };

  // Format active hours (e.g., "10:00" -> "10am")
  const formatTime = (timeStr: string) => {
    const [hours, mins] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}${ampm}`;
  };

  return (
    <div className="p-4 border-t border-[#1F1F1F] bg-[#080808]">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#555555]">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
              gatewayStatus.online ? "bg-[#22C55E] shadow-green-500/30 animate-pulse" : "bg-red-500 shadow-red-500/30"
            )} />
            GATEWAY {gatewayStatus.online ? 'ONLINE' : 'OFFLINE'}
          </div>
          {gatewayStatus.version && (
            <div className="text-[10px] font-mono text-[#8A8A8A] font-bold px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#1F1F1F]">
              v{gatewayStatus.version}
            </div>
          )}
        </div>

        {gatewayStatus.updateAvailable && (
          <button 
            onClick={async () => {
              if (!confirm(`Update OpenClaw to v${gatewayStatus.latestVersion}? This will restart the gateway.`)) return;
              setUpdating(true);
              try {
                const res = await fetch('/api/update', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  alert('Update initiated successfully. The dashboard will lose connection momentarily while the gateway restarts.');
                } else {
                  alert(`Update failed: ${data.error}`);
                }
              } catch (err) {
                console.error('Update fetch error:', err);
              } finally {
                setUpdating(false);
              }
            }}
            disabled={updating}
            className="mx-0.5 p-2 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 hover:bg-[#5E6AD2]/20 transition-all text-left w-full group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#5E6AD2] uppercase tracking-widest">
                {updating ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpCircle size={12} />}
                {updating ? 'Updating...' : 'Update Available'}
              </div>
            </div>
            <div className="text-[12px] text-[#EDEDED] font-mono font-bold pl-5">
              v{gatewayStatus.latestVersion}
            </div>
          </button>
        )}

        <div className="flex flex-col gap-1 pl-3.5 border-l border-[#1F1F1F]">
          <div className="flex items-center justify-between pr-2 mb-1.5">
            <button onClick={onNavigateToSessions} className="flex flex-col gap-0.5 hover:bg-[#1A1A1A]/50 rounded px-1.5 py-1 -mx-1.5 transition-all">
              <div className="text-[9px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
                <Users size={10} className="text-[#555555]" /> Sessions
              </div>
              <div className="text-[10px] text-[#EDEDED] font-mono pl-4">{sessions?.length || 0}</div>
            </button>
            <button onClick={onNavigateToJobs} className="flex flex-col gap-0.5 hover:bg-[#1A1A1A]/50 rounded px-1.5 py-1 -mx-1.5 transition-all">
              <div className="text-[9px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={10} className="text-[#555555]" /> Jobs
              </div>
              <div className="text-[10px] text-[#EDEDED] font-mono pl-4">{jobs?.filter((j: any) => j.enabled).length || 0}</div>
            </button>
          </div>

          {/* Model Status Section */}
          <button onClick={onNavigateToModel} className="flex items-center gap-2 pr-2 mb-1.5 hover:bg-[#1A1A1A]/50 rounded px-1.5 py-1 -mx-1.5 transition-all">
            <Brain size={10} className="text-[#555555]" />
            <div className="flex flex-col gap-0 text-[10px] text-[#EDEDED] font-mono truncate max-w-[200px]">
              {modelStatus?.modelName ? (
                <>
                  <div className="text-[9px] text-[#999999]">
                    {modelStatus.provider || ''} / {modelStatus.host || ''}
                  </div>
                  <div>{modelStatus.modelName}</div>
                </>
              ) : (
                <div>Loading...</div>
              )}
            </div>
          </button>

          {/* Heartbeat Status Section */}
          <button
            onClick={onNavigateToHeartbeat}
            onMouseEnter={() => setHeartbeatTooltip(true)}
            onMouseLeave={() => setHeartbeatTooltip(false)}
            className="relative text-left group transition-all hover:bg-[#1A1A1A]/50 rounded px-1.5 py-1 -mx-1.5"
            suppressHydrationWarning
          >
            <div className="text-[9px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Heart size={9} className="text-[#555555]" />
              {gatewayStatus.heartbeatInterval && (
                <span>{formatInterval(gatewayStatus.heartbeatInterval)}</span>
              )}
              {gatewayStatus.heartbeatActiveHours?.start && gatewayStatus.heartbeatActiveHours?.end && (
                <>
                  {gatewayStatus.heartbeatInterval && <span className="text-[#444444]">|</span>}
                  <span>
                    {formatTime(gatewayStatus.heartbeatActiveHours.start)}
                    <span className="text-[#444444]">–</span>
                    {formatTime(gatewayStatus.heartbeatActiveHours.end)}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-0.5 text-[10px] text-[#8A8A8A] font-mono">
              {gatewayStatus.lastHeartbeat?.ts ? (
                <>
                  <div>
                    <span className="text-[#EDEDED]">{formatHeartbeatTime(gatewayStatus.lastHeartbeat.ts)}</span>
                    <span className="mx-1 text-[#333333]">|</span>
                    <span className={cn(
                      gatewayStatus.lastHeartbeat.status?.startsWith('ok') ? "text-green-500/70" : "text-red-500/70"
                    )}>
                      {gatewayStatus.lastHeartbeat.silent ? 'SILENT' : 'ALERT'}
                    </span>
                  </div>
                </>
              ) : gatewayStatus.lastHeartbeat?.lastHeartbeatText ? null : (
                <span className="text-[#666666] italic">
                  {gatewayStatus.online ? 'NO DATA' : 'WAITING...'}
                </span>
              )}
            </div>

            {/* Tooltip */}
            {heartbeatTooltip && gatewayStatus.lastHeartbeat?.lastHeartbeatText && (
              <div className="absolute bottom-full left-0 mb-2 p-2.5 bg-[#1A1A1A] border border-[#333333] rounded-md shadow-xl z-50 w-64 text-[10px] text-[#EDEDED] leading-relaxed max-h-32 overflow-y-auto">
                {gatewayStatus.lastHeartbeat.lastHeartbeatText}
              </div>
            )}

          </button>
          {/* Git Status Section */}
          <button onClick={onNavigateToGit} className="flex items-center gap-3 pr-2 mb-1.5 flex-wrap hover:bg-[#1A1A1A]/50 rounded px-1.5 py-1 -mx-1.5 transition-all">
            <div className="flex flex-col gap-0.5">
              <div className="text-[9px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
                <GitBranch size={10} className="text-[#555555]" /> STAGED
              </div>
              <div className="text-[10px] text-[#EDEDED] font-mono pl-4">{gitStatus?.staged?.length || 0}</div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[9px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
                UNSTAGED
              </div>
              <div className="text-[10px] text-[#EDEDED] font-mono pl-4">{gitStatus?.unstaged?.length || 0}</div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[9px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
                UNTRACK
              </div>
              <div className="text-[10px] text-[#EDEDED] font-mono pl-4">{gitStatus?.untracked?.length || 0}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
