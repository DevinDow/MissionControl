import React from 'react';
import { Calendar as CalendarIcon, MapPin, User, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export const groupEventsByDate = (events: any[]) => {
  const groups: Record<string, any[]> = {};
  events.forEach(event => {
    const date = new Date(event.start);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(event);
  });
  return groups;
};

export function CalendarToolLeft({ events, matchesFilter, setSelectedEventId, setSelectedJobId, setSelectedFilePath, setSelectedTaskId, selectedEventId }: { events: any[], matchesFilter: any, setSelectedEventId: any, setSelectedJobId: any, setSelectedFilePath: any, setSelectedTaskId: any, selectedEventId: any }) {
  const calendarGroups = groupEventsByDate(events);

  return (
    <div className="space-y-4">
      {Object.entries(calendarGroups).map(([date, dateEvents]) => {
                  const filteredEvents = dateEvents.filter(e => matchesFilter(e.summary));
                  if (filteredEvents.length === 0) return null;
                  return (
                    <div key={date} className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">
                        <CalendarIcon size={12} />
                        {date}
                      </div>
                      <div className="ml-2 border-l border-[#1F1F1F] space-y-0.5">
                        {filteredEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => { setSelectedEventId(event.id); setSelectedJobId(null); setSelectedFilePath(null); setSelectedTaskId(null); }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex flex-col border border-transparent group",
                              selectedEventId === event.id
                                ? "bg-[#111111] text-white border-[#1F1F1F]"
                                : "text-white hover:text-[#EDEDED] hover:bg-[#111111]/50"
                            )}
                          >
                            <div className="truncate" suppressHydrationWarning>
                              <span className="text-[11px] font-bold text-[#555555] mr-1">
                                {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()} -
                              </span>
                              <span className="group-hover:text-white transition-colors">{event.summary}</span>
                            </div>
                            <div className="text-[10px] text-[#5E6AD2]/50 font-medium ml-[52px]">
                              {event.calendarName}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
    </div>
  );
}

export function CalendarToolRight({ selectedEvent }: any) {
  if (!selectedEvent) return <div className="p-8 text-[#555555]">Select an event to view details</div>;
  return (
    <div className="p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center gap-3">
                  <CalendarIcon size={24} className="text-[#5E6AD2]" />
                  <h2 className="text-lg font-semibold text-white">{selectedEvent.summary}</h2>
                </div>

                <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3">Time</div>
                      <div className="text-[14px] text-[#EDEDED] font-medium" suppressHydrationWarning>
                        {new Date(selectedEvent.start).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3">Calendar</div>
                      <div className="text-[14px] text-[#EDEDED] font-medium bg-[#1A1A1A] px-3 py-1.5 rounded-lg border border-[#1F1F1F] inline-block capitalize">{selectedEvent.calendarName}</div>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div>
                      <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MapPin size={12} className="text-[#5E6AD2]" />
                        Location
                      </div>
                      <div className="text-[14px] text-[#EDEDED]">{selectedEvent.location}</div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#1F1F1F]">
                    <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <User size={12} className="text-[#5E6AD2]" />
                      Created By
                    </div>
                    <div className="text-[14px] text-[#EDEDED] font-mono">{selectedEvent.creator}</div>
                  </div>

                  <div className="pt-4 border-t border-[#1F1F1F]">
                    <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText size={12} className="text-[#5E6AD2]" />
                      Description
                    </div>
                    <div className="text-[14px] text-white leading-relaxed whitespace-pre-wrap">
                      {selectedEvent.description || 'No description provided.'}
                    </div>
                  </div>
                </div>
              </div>
  );
}
