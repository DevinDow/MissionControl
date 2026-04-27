import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Save, X, Check, ToggleLeft, ToggleRight, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';

export function JobsToolLeft({ 
  jobs, 
  matchesFilter, 
  selectedJobId, 
  setSelectedJobId, 
  setSelectedTaskId, 
  setSelectedEventId, 
  setViewingJobLog 
}: any) {
  
  return (
    <>
      {(jobs || []).filter((j: any) => matchesFilter(j.name)).map((job: any) => {
        const parts = job.schedule.expr.split(' ');
        let timeStr = "Manual";

        if (parts.length >= 2) {
          const m = parts[0];
          const h = parts[1];
          let hVal = parseInt(h);
          let mVal = parseInt(m);

          if (parts.length === 6) {
            mVal = parseInt(parts[1]);
            hVal = parseInt(parts[2]);
          }

          if (!isNaN(hVal) && !isNaN(mVal)) {
            const period = hVal >= 12 ? 'PM' : 'AM';
            const displayHour = hVal % 12 || 12;
            timeStr = `${displayHour}:${mVal.toString().padStart(2, '0')} ${period}`;
          }
        }

        return (
          <button 
            key={job.id} 
            onClick={() => { 
              setSelectedJobId(job.id); 
              setSelectedTaskId(null); 
              setSelectedEventId(null); 
              setViewingJobLog(false); 
            }} 
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all group", 
              selectedJobId === job.id ? "bg-[#111111] border-[#1F1F1F]" : "border-transparent hover:bg-[#111111]/50",
              !job.enabled && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3 mb-1">
              <div className={cn(
                "p-1.5 rounded bg-[#161616] border border-[#1F1F1F] shrink-0", 
                !job.enabled ? "text-[#555555]" : (job.state?.lastStatus === 'error' ? "text-red-500" : "text-[#5E6AD2]")
              )}>
                <Clock size={14} />
              </div>
              <span className={cn(
                "text-[13px] font-medium break-words whitespace-pre-wrap leading-tight",
                !job.enabled ? "text-[#888888]" : "text-[#EDEDED]"
              )}>
                <span className={cn("font-bold mr-1", !job.enabled ? "text-[#555555]" : "text-[#5E6AD2]")}>{timeStr} -</span>
                {job.name}
              </span>
            </div>
          </button>
        );
      })}
    </>
  );
}

export function JobsToolRight({ 
  selectedJob, 
  setActiveTab, 
  setSelectedFilePath,
  refreshJobs
}: any) {
  const CRON_REGEX = /^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|(\d+L?)|(\*(\/\d+)?)|(L(-\d+)?)|(\?)|([A-Z]{3}(-[A-Z]{3})?)) ?){5,7})$/;
  const [editedSchedule, setEditedSchedule] = useState('');
  const [editedEnabled, setEditedEnabled] = useState(false);
  const [editedThinking, setEditedThinking] = useState('off');
  const [isSaving, setIsSaving] = useState(false);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (selectedJob) {
      setEditedSchedule(selectedJob.schedule.expr);
      setEditedEnabled(selectedJob.enabled);
      setEditedThinking(selectedJob.payload.thinking || 'off');
      setIsValid(true);
    }
  }, [selectedJob]);

  useEffect(() => {
    setIsValid(CRON_REGEX.test(editedSchedule.trim()));
  }, [editedSchedule]);

  if (!selectedJob) return <div className="p-8 text-[#555555]">Select a job to view details</div>;

  const isDirty = editedSchedule !== selectedJob.schedule.expr || editedEnabled !== selectedJob.enabled || editedThinking !== (selectedJob.payload.thinking || 'off');

  const handleSave = async () => {
    if (!isDirty || !isValid || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedJob.id,
          enabled: editedEnabled,
          scheduleExpr: editedSchedule,
          thinking: editedThinking
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update job');
      }
      await refreshJobs?.();
    } catch (err) {
      console.error('Update job failed:', err);
      alert(`Failed to update job: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditedSchedule(selectedJob.schedule.expr);
    setEditedEnabled(selectedJob.enabled);
    setEditedThinking(selectedJob.payload.thinking || 'off');
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={24} className="text-[#5E6AD2]" />
          <h2 className="text-lg font-semibold text-white">{selectedJob.name}</h2>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="p-2 rounded-lg bg-[#111111] border border-[#1F1F1F] text-[#8A8A8A] hover:text-white transition-colors"
              title="Reset changes"
            >
              <X size={16} />
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5E6AD2] text-white text-[13px] font-bold hover:bg-[#4E5AC2] transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
          </div>
        )}
      </div>
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2">Schedule</div>
            <input 
              type="text" 
              value={editedSchedule}
              onChange={(e) => setEditedSchedule(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className={cn(
                "w-full bg-[#161616] border rounded px-3 py-1.5 text-[13px] text-[#EDEDED] font-mono transition-colors focus:outline-none",
                isValid ? "border-[#2A2A2A] focus:border-[#5E6AD2]" : "border-red-500/50 focus:border-red-500"
              )}
            />
            {!isValid && (
              <div className="text-[11px] text-red-500 mt-1 font-medium">Invalid cron expression</div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2">Status</div>
            <button 
              onClick={() => setEditedEnabled(!editedEnabled)}
              className={cn(
                "flex items-center gap-2 text-[13px] font-bold uppercase transition-colors group",
                editedEnabled ? "text-green-500" : "text-red-400"
              )}
            >
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                editedEnabled ? "bg-green-500/20 border border-green-500/50" : "bg-red-500/20 border border-red-500/50"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-[14px] h-[14px] rounded-full transition-all",
                  editedEnabled ? "right-0.5 bg-green-500" : "left-0.5 bg-red-400"
                )} />
              </div>
              {editedEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2">Delivery</div>
            <div className="text-[13px] text-[#EDEDED] uppercase font-bold text-white/60">
              {selectedJob.state?.lastDeliveryStatus || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2">Consecutive Errors</div>
            <div className={cn("text-[13px] font-bold", (selectedJob.state?.consecutiveErrors || 0) > 0 ? "text-red-500" : "text-[#EDEDED]")}>
              {selectedJob.state?.consecutiveErrors || 0}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Brain size={12} className="text-[#5E6AD2]" />
              Thinking Level
            </div>
            <div className="flex items-center gap-1 bg-[#161616] border border-[#2A2A2A] rounded p-0.5 w-fit">
              {['off', 'low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setEditedThinking(level)}
                  className={cn(
                    "px-3 py-1 rounded text-[11px] font-bold uppercase transition-all",
                    editedThinking === level 
                      ? "bg-[#5E6AD2] text-white" 
                      : "text-[#8A8A8A] hover:text-white"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2">Instructions</div>
          <pre className="text-[13px] text-[#EDEDED] font-mono whitespace-pre-wrap">
            {selectedJob.payload.message?.split(/(specs\/[^\s]+\.md|[^\s]+\_spec\.md)/).map((part: string, i: number) => {
              if (part.endsWith('_spec.md') || part.endsWith('.md')) {
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedFilePath(part.includes('/') ? part : `specs/${part}`);
                      setActiveTab('Specs');
                    }}
                    className="text-[#5E6AD2] hover:text-white underline underline-offset-2 font-bold cursor-pointer transition-colors"
                  >
                    {part}
                  </button>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
