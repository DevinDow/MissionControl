import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Wrench, Search, ChevronRight, Link as LinkIcon, Loader2, File } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SkillsToolLeft({ skills, matchesFilter, setSelectedSkillId, setSelectedSkillFile, setSelectedJobId, setSelectedFilePath, setSelectedTaskId, setSelectedEventId, setSelectedSessionId, selectedSkillId }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">
                      Workspace Skills
                    </div>
                    {Array.isArray(skills?.workspace) && skills.workspace.filter(s => matchesFilter(s.name)).map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => {
                          setSelectedSkillId(skill.id);
                          const defaultFile = skill.hasReadme ? 'SKILL.md' : (skill.files[0]?.name || '');
                          setSelectedSkillFile(defaultFile);
                          setSelectedJobId(null); setSelectedFilePath(null); setSelectedTaskId(null); setSelectedEventId(null); setSelectedSessionId(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex items-center gap-2 group",
                          selectedSkillId === skill.id ? "bg-[#111111] text-white border border-[#1F1F1F]" : "text-[#8A8A8A] hover:text-[#EDEDED] border border-transparent"
                        )}
                      >
                        <Wrench size={14} className={selectedSkillId === skill.id ? "text-[#5E6AD2]" : "text-[#666666]"} />
                        <span className="truncate">{skill.name}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">
                      System Skills
                    </div>
                    {Array.isArray(skills?.system) && skills.system.filter(s => matchesFilter(s.name)).map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => {
                          setSelectedSkillId(skill.id);
                          const defaultFile = skill.hasReadme ? 'SKILL.md' : (skill.files[0]?.name || '');
                          setSelectedSkillFile(defaultFile);
                          setSelectedJobId(null); setSelectedFilePath(null); setSelectedTaskId(null); setSelectedEventId(null); setSelectedSessionId(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex items-center gap-2 group",
                          selectedSkillId === skill.id ? "bg-[#111111] text-white border border-[#1F1F1F]" : "text-[#8A8A8A] hover:text-[#EDEDED] border border-transparent"
                        )}
                      >
                        <Wrench size={14} className={selectedSkillId === skill.id ? "text-[#5E6AD2]" : "text-[#666666]"} />
                        <span className="truncate">{skill.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
    </div>
  );
}

const highlightMatches = (text: any, search: string) => {
  if (!search || typeof text !== 'string') return text;

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-[#FFFF00] text-black px-0.5 py-0 rounded" data-search-match="true">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function SkillsToolRight({ selectedSkill, selectedSkillFile, setSelectedSkillFile, loading, fileContent, fileSearch, setFileSearch, setCurrentMatchIndex, matchCount, setMatchCount, currentMatchIndex }: any) {
  React.useEffect(() => {
    if (!fileSearch) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }

    const matches = document.querySelectorAll('[data-search-match="true"]');
    setMatchCount(matches.length);
    if (matches.length > 0) {
      const target = matches[currentMatchIndex] || matches[0];
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      matches.forEach((match, idx) => {
        (match as HTMLElement).style.outline = idx === currentMatchIndex ? '2px solid #5E6AD2' : 'none';
        (match as HTMLElement).style.boxShadow = idx === currentMatchIndex ? '0 0 10px #FFFF00' : 'none';
      });
    }
  }, [fileSearch, currentMatchIndex, fileContent, setCurrentMatchIndex, setMatchCount]);

  if (!selectedSkill) return <div className="p-8 text-[#555555]">Select a skill to view documentation</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wrench size={24} className="text-[#5E6AD2]" />
                      <div>
                        <h2 className="text-lg font-semibold text-white">{selectedSkill.name}</h2>
                        <div className="text-[11px] text-[#555555] font-bold uppercase tracking-wider">{selectedSkill.origin} skill</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="relative w-64 flex items-center bg-[#111111] border border-[#1F1F1F] rounded-md overflow-hidden focus-within:border-[#5E6AD2]/50">
                          <Search size={14} className="ml-2.5 text-[#666666]" />
                          <input
                            type="text"
                            placeholder="Find in skill..."
                            value={fileSearch}
                            onChange={(e) => { setFileSearch(e.target.value); setCurrentMatchIndex(0); }}
                            className="w-full bg-transparent px-2 py-1.5 text-[12px] text-[#EDEDED] focus:outline-none"
                          />
                          {matchCount > 0 && (
                            <div className="flex items-center gap-1 px-2 border-l border-[#1F1F1F]">
                              <span className="text-[10px] font-mono text-[#555555] whitespace-nowrap">{currentMatchIndex + 1}/{matchCount}</span>
                              <button
                                onClick={() => setCurrentMatchIndex(prev => (prev > 0 ? prev - 1 : matchCount - 1))}
                                className="p-0.5 hover:text-[#5E6AD2] transition-colors"
                              >
                                <ChevronRight size={14} className="rotate-180" />
                              </button>
                              <button
                                onClick={() => setCurrentMatchIndex(prev => (prev < matchCount - 1 ? prev + 1 : 0))}
                                className="p-0.5 hover:text-[#5E6AD2] transition-colors"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedSkill.meta?.version && <div className="text-[11px] text-[#555555] font-bold uppercase tracking-wider">v{selectedSkill.meta.version}</div>}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#080808] space-y-6">
                  <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 space-y-4">
                    <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-widest">Skill Files</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.files.map((file: any) => (
                        <button
                          key={file.name}
                          onClick={() => setSelectedSkillFile(file.name)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-[12px] font-mono transition-all flex items-center gap-2 border",
                            selectedSkillFile === file.name
                              ? "bg-[#5E6AD2]/10 text-[#5E6AD2] border-[#5E6AD2]/30"
                              : "bg-[#161616] text-[#8A8A8A] border-[#1F1F1F] hover:text-[#EDEDED]"
                          )}
                        >
                          <File size={12} /> {file.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-[#1F1F1F] bg-[#111111] flex items-center justify-between">
                      <div className="text-[11px] font-bold text-[#666666] uppercase tracking-widest">{selectedSkillFile}</div>
                      <LinkIcon size={14} className="text-[#666666]" />
                    </div>
                    <div className="p-8 prose prose-invert prose-sm max-w-none">
                      {loading.content ? <Loader2 size={32} className="text-[#5E6AD2] animate-spin mx-auto" /> :
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: (props) => <h1 className="text-2xl font-bold text-white border-b border-[#1F1F1F] pb-4 mb-8 mt-12 first:mt-0" {...props}>{highlightMatches(props.children, fileSearch)}</h1>,
                            h2: (props) => <h2 className="text-lg font-bold text-white mt-12 mb-4 border-l-2 border-[#5E6AD2] pl-4" {...props}>{highlightMatches(props.children, fileSearch)}</h2>,
                            h3: (props) => <h3 className="text-md font-bold text-white mt-10 mb-3" {...props}>{highlightMatches(props.children, fileSearch)}</h3>,
                            h4: (props) => <h4 className="text-sm font-bold text-white mt-8 mb-2" {...props}>{highlightMatches(props.children, fileSearch)}</h4>,
                            p: (props) => <p className="mb-4 leading-relaxed" {...props}>{highlightMatches(props.children, fileSearch)}</p>,
                            a: (props) => <a className="text-[#5E6AD2] hover:text-[#4A56C0] underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                            table: (props) => (
                              <div className="my-6 overflow-x-auto rounded-lg border border-[#5E6AD2]">
                                <table className="w-full border-collapse text-[13px]" {...props} />
                              </div>
                            ),
                            thead: (props) => <thead className="bg-[#5E6AD2]/20 border-b border-[#5E6AD2]" {...props} />,
                            th: (props) => <th className="px-4 py-2 text-left font-bold text-[#5E6AD2] uppercase tracking-wider border-r border-[#5E6AD2]/60 last:border-r-0" {...props}>{highlightMatches(props.children, fileSearch)}</th>,
                            td: (props) => <td className="px-4 py-2 border-t border-r border-[#5E6AD2]/60 last:border-r-0 text-[#EDEDED]" {...props}>{highlightMatches(props.children, fileSearch)}</td>,
                            code: ({node, inline, className, children, ...props}: any) => {
                              const hasNewline = String(children).includes('\n');
                              return (inline || !hasNewline) ? <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-[12px] font-mono text-[#5E6AD2]" {...props}>{highlightMatches(children, fileSearch)}</code> :
                              <pre className="bg-[#080808] border border-[#1F1F1F] p-4 rounded-xl overflow-x-auto my-6 ml-4"><code className={cn("text-[12px] font-mono text-[#EDEDED]", className)} {...props}>{children}</code></pre>;
                            },
                            li: (props) => <li className="flex gap-3 text-[14px] text-[#EDEDED] mb-2" {...props}><span className="text-[#5E6AD2] mt-1.5">•</span><div className="flex-1">{highlightMatches(props.children, fileSearch)}</div></li>,
                          }}
                        >
                          {fileContent}
                        </ReactMarkdown>
                      }
                    </div>
                  </div>
                </div>
              </div>
  );
}
