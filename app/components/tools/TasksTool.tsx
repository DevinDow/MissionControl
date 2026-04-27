import React from 'react';
import { CheckSquare, AlertCircle, Trophy, Zap, ArrowUpCircle, Footprints, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TasksToolLeft({ 
  tasks, 
  matchesFilter, 
  selectedTaskId, 
  setSelectedTaskId, 
  setSelectedJobId, 
  setSelectedFilePath, 
  setSelectedEventId 
}: { 
  tasks: any[], 
  matchesFilter: (text: string) => boolean,
  selectedTaskId: string | null,
  setSelectedTaskId: (id: string | null) => void,
  setSelectedJobId: (id: string | null) => void,
  setSelectedFilePath: (path: string | null) => void,
  setSelectedEventId: (id: string | null) => void
}) {
  return (
    <>
      {(tasks || []).filter(t => matchesFilter(`${t["task name"]} ${t.category}`)).map(task => {
        const u = parseInt(task.urgency) || 0;
        const i = parseInt(task.importance) || 0;
        const e = parseInt(task.ease) || 0;
        const maxVal = Math.max(u, i, e);
        let metricLabel = "";
        let metricColor = "text-[#555555]";

        if (maxVal > 0) {
          if (maxVal === u) {
            metricLabel = `Urgency=${u}`;
            metricColor = "text-red-500";
          } else if (maxVal === i) {
            metricLabel = `Importance=${i}`;
            metricColor = "text-yellow-500";
          } else {
            metricLabel = `Ease=${e}`;
            metricColor = "text-green-500";
          }
        }

        return (
          <button
            key={task.id}
            onClick={() => { 
              setSelectedTaskId(task.id); 
              setSelectedJobId(null); 
              setSelectedFilePath(null); 
              setSelectedEventId(null); 
            }}
            className={cn(
              "w-full text-left p-3 border-b border-[#1F1F1F] transition-all group",
              selectedTaskId === task.id ? "bg-[#111111] border-[#1F1F1F]" : "hover:bg-[#111111]/50 border-transparent"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-[#161616] border border-[#1F1F1F] text-[#5E6AD2] group-hover:bg-[#5E6AD2]/10 transition-all">
                <CheckSquare size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#EDEDED] leading-snug truncate">
                  <span className="text-[#5E6AD2] font-bold mr-1">{task.sum}-</span>
                  {task["task name"]}
                  {task["next tiny step"] && <span className="text-[#555555] ml-1">-{task["next tiny step"]}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[9px] text-[#555555] font-bold uppercase tracking-wider">
                  <span className="text-[#5E6AD2]/50 font-medium normal-case">{task.category}</span>
                  {task["due date"] && <span className="text-white/40">{task["due date"]}</span>}
                  {metricLabel && <span className={cn("ml-auto", metricColor)}>{metricLabel}</span>}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}

export function TasksToolRight({ selectedTask }: { selectedTask: any }) {
  if (!selectedTask) return null;

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <CheckSquare size={24} className="text-[#5E6AD2]" />
        <h2 className="text-lg font-semibold text-white">{selectedTask["task name"]}</h2>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Urgency', val: selectedTask.urgency, icon: AlertCircle },
          { label: 'Importance', val: selectedTask.importance, icon: Trophy },
          { label: 'Ease', val: selectedTask.ease, icon: Zap },
          { label: 'Sum', val: selectedTask.sum, icon: ArrowUpCircle }
        ].map(stat => (
          <div key={stat.label} className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-xl flex flex-col items-center">
            <stat.icon size={14} className="text-[#666666] mb-2" />
            <div className="text-[10px] text-[#8A8A8A] font-bold uppercase tracking-widest">{stat.label}</div>
            <div className="text-xl font-bold text-white mt-1">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3">Category</div>
            <div className="text-[14px] text-[#EDEDED] font-medium bg-[#1A1A1A] px-3 py-1.5 rounded-lg border border-[#1F1F1F] inline-block capitalize">{selectedTask.category || 'Uncategorized'}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3">Due Date</div>
            <div className="text-[14px] text-[#EDEDED] font-medium">{selectedTask['due date'] || 'No Deadline'}</div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2 flex items-center gap-2">
              <Footprints size={12} className="text-[#5E6AD2]" />
              Next Tiny Step
            </div>
            <div className="text-[14px] text-[#EDEDED] leading-relaxed italic">{selectedTask["next tiny step"] || 'Not defined'}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2 flex items-center gap-2">
              <Compass size={12} className="text-[#5E6AD2]" />
              Perspective Note
            </div>
            <div className="text-[14px] text-[#EDEDED] leading-relaxed">{selectedTask["perspective note"] || 'No perspective added.'}</div>
          </div>
        </div>

        {Object.keys(selectedTask).filter(k => !['id', 'task name', 'category', 'urgency', 'importance', 'ease', 'sum', 'due date', 'next tiny step', 'perspective note'].includes(k)).map(k => (
          <div key={k} className="pt-4 border-t border-[#1F1F1F]">
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-2 capitalize">{k}</div>
            <div className="text-[14px] text-[#EDEDED] leading-relaxed">{selectedTask[k] || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
