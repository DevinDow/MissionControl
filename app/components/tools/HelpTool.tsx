import React from 'react';
import { Link as LinkIcon, Terminal, Zap, HelpCircle, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function HelpToolLeft({ setSelectedHelpId, setSelectedJobId, setSelectedFilePath, setSelectedTaskId, setSelectedEventId, setSelectedSessionId, selectedHelpId }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">
                      Resources
                    </div>
                    {[
                      { id: 'Links', name: 'External Links', icon: LinkIcon },
                      { id: 'Shortcuts', name: 'Keyboard Shortcuts', icon: Terminal },
                      { id: 'CLI', name: 'CLI Reference', icon: Zap }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedHelpId(item.id); setSelectedJobId(null); setSelectedFilePath(null); setSelectedTaskId(null); setSelectedEventId(null); setSelectedSessionId(null); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex items-center gap-2 group",
                          selectedHelpId === item.id ? "bg-[#111111] text-white border border-[#1F1F1F]" : "text-[#8A8A8A] hover:text-[#EDEDED] border border-transparent"
                        )}
                      >
                        <item.icon size={14} className={selectedHelpId === item.id ? "text-[#5E6AD2]" : "text-[#666666]"} />
                        <span className="truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
    </div>
  );
}

export function HelpToolRight({ selectedHelpId, helpLinks, helpShortcuts, helpCli, gatewayStatus }: any) {
  if (!selectedHelpId) return <div className="p-8 text-[#555555]">Select a help resource</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={24} className="text-[#5E6AD2]" />
                    <h2 className="text-lg font-semibold text-white">
                      {selectedHelpId === 'Links' ? 'External Links' :
                       selectedHelpId === 'Shortcuts' ? 'Keyboard Shortcuts' :
                       'CLI Reference'}
                    </h2>
                  </div>
                  <div className="text-[11px] font-mono text-[#666666]">OpenClaw v{gatewayStatus.version}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#080808]">
                  {selectedHelpId === 'Links' && (
                    <div className="space-y-8">
                      {helpLinks.map((group: any) => (
                        <div key={group.group} className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
                          <div className="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <LinkIcon size={14} /> {group.group}
                          </div>
                          <div className="flex flex-col border border-[#1F1F1F] rounded-lg overflow-hidden divide-y divide-[#1F1F1F]">
                            {group.items.map((item: any) => (
                              <a
                                key={item.name}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-3 bg-[#0D0D0D] hover:bg-[#161616] transition-all group flex items-center justify-between"
                              >
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-[13px] font-bold text-[#EDEDED] group-hover:text-[#5E6AD2] transition-colors">
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-[#555555] font-mono">{item.url.replace('https://', '')}</div>
                                </div>
                                <ChevronRight size={14} className="text-[#666666] group-hover:text-[#5E6AD2] group-hover:translate-x-0.5 transition-all" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedHelpId === 'Shortcuts' && (
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
                        <div className="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Terminal size={14} /> Mission Control Shortcuts
                        </div>
                        <div className="space-y-1">
                          {helpShortcuts.map((s: any) => (
                            <div key={s.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#161616] transition-colors border border-transparent hover:border-[#1F1F1F]">
                              <span className="text-[13px] text-white">{s.action}</span>
                              <kbd className="px-3 py-1 rounded bg-[#1A1A1A] border border-[#1F1F1F] text-[#5E6AD2] font-mono text-[12px] min-w-[50px] text-center shadow-lg">{s.key}</kbd>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedHelpId === 'CLI' && (
                    <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
                      <div className="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={14} /> OpenClaw CLI Documentation
                      </div>
                      <pre className="bg-[#080808] border border-[#1F1F1F] p-6 rounded-lg text-[13px] font-mono text-white overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-[#1F1F1F]">
                        {helpCli}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
  );
}
