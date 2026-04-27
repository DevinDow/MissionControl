import React from 'react';
import { GitBranch, GitCommit, Loader2, Minus, Plus, History, Send, ChevronRight, CheckCircle2, Terminal, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function GitToolLeft({ gitStatus, selectedGitFile, setSelectedGitFile, selectedGitType, setSelectedGitType, setSelectedGitCommit, gitStale, selectedGitCommit, setGitDiff, refreshGitStatus }: any) {
  const [commitMessage, setCommitMessage] = React.useState('');
  const [gitLoading, setGitLoading] = React.useState(false);

  const handleGitAction = async (action: string, file?: string, message?: string) => {
    setGitLoading(true);
    try {
      const res = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, file, message })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Git Error: ${data.error}\n${data.stderr}`);
      } else {
        if (action === 'commit') setCommitMessage('');
        await refreshGitStatus?.();
        if (selectedGitFile) {
          const diffRes = await fetch(`/api/git/diff?file=${encodeURIComponent(selectedGitFile)}`);
          const diffData = await diffRes.json();
          setGitDiff({ staged: diffData.staged, unstaged: diffData.unstaged, untracked: diffData.untracked, commit: null });
        }
      }
    } catch (err) {
      console.error('Git action failed:', err);
    } finally {
      setGitLoading(false);
    }
  };

  return (
<div className="space-y-4 pr-2">
                  {gitStatus ? (
                    <>
                      <div className="flex items-center gap-2 px-2 pt-2 pb-2 border-b border-[#1F1F1F]">
                        <GitBranch size={14} className="text-[#5E6AD2] shrink-0" aria-hidden />
                        <span className="text-[10px] font-bold text-[#555555] uppercase tracking-widest shrink-0">Branch</span>
                        <span
                          className="text-[12px] font-mono text-[#EDEDED] truncate min-w-0 flex-1"
                          title={gitStatus.branch ?? ''}
                        >
                          {gitStatus.branch ?? '—'}
                        </span>
                      </div>
                      {/* Commit Section (Moved to Top) */}
                      <div className="pt-2 space-y-3">
                        <div className="text-[10px] font-bold text-[#555555] uppercase tracking-widest px-2">Commit Changes</div>
                        <div className="px-1 relative">
                          <textarea
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Commit message..."
                            rows={2}
                            className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-md px-3 py-2 pr-10 text-[12px] font-mono text-[#EDEDED] focus:outline-none focus:border-[#5E6AD2]/50 resize-none"
                          />
                          <button
                            onClick={() => handleGitAction('commit', undefined, commitMessage)}
                            disabled={gitLoading || !commitMessage || gitStatus.staged.length === 0}
                            className="absolute right-3 bottom-3 p-1.5 rounded-md text-[#5E6AD2] hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-[#5E6AD2]"
                            title="Commit staged changes"
                          >
                            {gitLoading ? <Loader2 size={16} className="animate-spin" /> : <GitCommit size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Changes Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <div className="text-[10px] font-bold text-[#555555] uppercase tracking-widest">Working Tree</div>
                          {gitStale && (
                            <div className="flex items-center gap-1.5 text-[9px] text-[#5E6AD2] font-black animate-pulse">
                              <RefreshCw size={10} className="animate-spin" /> SYNCING
                            </div>
                          )}
                        </div>
                        {/* Staged */}
                        {(gitStatus.staged?.length || 0) > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="px-2 py-1 text-[10px] font-bold text-green-500 uppercase tracking-widest">Staged Changes</div>
                              <button 
                                onClick={() => handleGitAction('unstage')}
                                disabled={gitLoading}
                                className="text-[9px] text-[#555555] hover:text-red-500 font-bold uppercase transition-colors"
                              >
                                Unstage All
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {gitStatus.staged?.map(file => (
                                <div key={`staged-${file}`} className="flex items-center gap-1 group/item">
                                  <button
                                    onClick={() => {
                                      if (selectedGitFile === file && selectedGitType === 'staged') {
                                        setSelectedGitFile(null);
                                        setSelectedGitType(null);
                                      } else {
                                        setSelectedGitCommit(null);
                                        setSelectedGitFile(file);
                                        setSelectedGitType('staged');
                                      }
                                    }}
                                    className={cn(
                                      "flex-1 text-left px-3 py-1.5 rounded text-[12px] transition-all flex items-center gap-2 min-w-0",
                                      (selectedGitFile === file && selectedGitType === 'staged') ? "bg-[#1F1F1F] text-white" : "text-[#8A8A8A] hover:bg-[#161616]"
                                    )}
                                    title={file}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                    <span className="truncate">{file}</span>
                                  </button>
                                  <button 
                                    onClick={() => handleGitAction('unstage', file)}
                                    disabled={gitLoading}
                                    className="p-1 hover:bg-red-500/20 text-[#333333] hover:text-red-500 rounded transition-all opacity-0 group-hover/item:opacity-100"
                                    title="Unstage file"
                                  >
                                    <Minus size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unstaged */}
                        {(gitStatus.unstaged?.length || 0) > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="px-2 py-1 text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Unstaged Changes</div>
                              <button 
                                onClick={() => handleGitAction('stage')}
                                disabled={gitLoading}
                                className="text-[9px] text-[#555555] hover:text-green-500 font-bold uppercase transition-colors"
                              >
                                Stage All
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {gitStatus.unstaged?.map(file => (
                                <div key={`unstaged-${file}`} className="flex items-center gap-1 group/item">
                                  <button
                                    onClick={() => {
                                      if (selectedGitFile === file && selectedGitType === 'unstaged') {
                                        setSelectedGitFile(null);
                                        setSelectedGitType(null);
                                      } else {
                                        setSelectedGitCommit(null);
                                        setSelectedGitFile(file);
                                        setSelectedGitType('unstaged');
                                      }
                                    }}
                                    className={cn(
                                      "flex-1 text-left px-3 py-1.5 rounded text-[12px] transition-all flex items-center gap-2 min-w-0",
                                      (selectedGitFile === file && selectedGitType === 'unstaged') ? "bg-[#1F1F1F] text-white" : "text-[#8A8A8A] hover:bg-[#161616]"
                                    )}
                                    title={file}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                    <span className="truncate">{file}</span>
                                  </button>
                                  <button 
                                    onClick={() => handleGitAction('stage', file)}
                                    disabled={gitLoading}
                                    className="p-1 hover:bg-green-500/20 text-[#333333] hover:text-green-500 rounded transition-all opacity-0 group-hover/item:opacity-100"
                                    title="Stage file"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Untracked */}
                        {(gitStatus.untracked?.length || 0) > 0 && (
                          <div>
                            <div className="px-2 py-1 text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1">Untracked</div>
                            <div className="space-y-0.5">
                                {gitStatus.untracked?.map(file => (
                                  <div key={`untracked-${file}`} className="flex items-center gap-1 group/item">
                                    <button
                                      onClick={() => {
                                        if (selectedGitFile === file && selectedGitType === 'untracked') {
                                          setSelectedGitFile(null);
                                          setSelectedGitType(null);
                                        } else {
                                          setSelectedGitCommit(null);
                                          setSelectedGitFile(file);
                                          setSelectedGitType('untracked');
                                        }
                                      }}
                                      className={cn(
                                        "flex-1 text-left px-3 py-1.5 rounded text-[12px] transition-all flex items-center gap-2 min-w-0 font-medium italic",
                                        (selectedGitFile === file && selectedGitType === 'untracked') ? "bg-[#1F1F1F] text-white" : "text-[#555555] hover:bg-[#161616]"
                                      )}
                                      title={file}
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#333333] shrink-0" />
                                      <span className="truncate">{file}</span>
                                    </button>
                                    <button 
                                      onClick={() => handleGitAction('stage', file)}
                                      disabled={gitLoading}
                                      className="p-1 hover:bg-green-500/20 text-[#333333] hover:text-green-500 rounded transition-all opacity-0 group-hover/item:opacity-100"
                                      title="Stage new file"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {(gitStatus.staged?.length === 0 && gitStatus.unstaged?.length === 0 && gitStatus.untracked?.length === 0) && (
                          <div className="px-3 py-8 text-center bg-[#0D0D0D] rounded-xl border border-dashed border-[#1F1F1F]">
                            <div className="text-green-500/50 mb-2 flex justify-center"><CheckCircle2 size={24} /></div>
                            <div className="text-[11px] text-[#555555] font-medium">Working tree clean</div>
                          </div>
                        )}
                      </div>

                      {/* Commits Section */}
                      <div className="pt-4 border-t border-[#1F1F1F]">
                        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                          <div className="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider flex items-center gap-2">
                            <History size={12} /> Recent Commits
                          </div>
                          <div className="flex items-center gap-2">
                            {(gitStatus.aheadCount || 0) > 0 && (
                              <button
                                onClick={() => handleGitAction('push')}
                                disabled={gitLoading}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-all text-[9px] font-black"
                              >
                                <Send size={10} /> {gitStatus.aheadCount} AHEAD · PUSH
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {gitStatus.commits?.map((c, i) => {
                            const isRemoteHead = gitStatus.remoteHash && (c.hash === gitStatus.remoteHash || gitStatus.remoteHash.startsWith(c.hash));
                            const isLocalHead = i === 0;
                            const isSelected = selectedGitCommit === c.hash;

                            return (
                              <button
                                key={c.hash}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedGitCommit(null);
                                    setSelectedGitType(null);
                                  } else {
                                    setSelectedGitFile(null);
                                    setSelectedGitType('commit');
                                    setSelectedGitCommit(c.hash);
                                  }
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-md border transition-all relative overflow-hidden group/commit",
                                  isSelected ? "bg-[#1F1F1F] border-[#5E6AD2]/50" : "bg-[#0D0D0D] border-[#1F1F1F] hover:bg-[#161616]",
                                  isLocalHead && (gitStatus.aheadCount || 0) > 0 && !isSelected ? "border-red-500/30" : "",
                                  isRemoteHead && !isSelected ? "border-[#5E6AD2]/40" : ""
                                )}
                              >
                                {isRemoteHead && (
                                  <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-[#5E6AD2]/20 text-[#5E6AD2] text-[8px] font-black tracking-tighter rounded-bl">
                                    REMOTE
                                  </div>
                                )}
                                {isLocalHead && (gitStatus.aheadCount || 0) > 0 && (
                                  <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black tracking-tighter rounded-bl">
                                    LOCAL
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-2">
                                  <span className={cn(
                                    "text-[12px] font-bold break-words whitespace-pre-wrap leading-tight",
                                    isSelected ? "text-[#5E6AD2]" : "text-white"
                                  )}>{c.subject}</span>
                                  <span className="text-[10px] font-mono text-[#5E6AD2] shrink-0 self-start mt-0.5">{c.hash}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[10px] text-[#555555]">
                                  <span>{c.author}</span>
                                  <span>{c.date}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-10"><Loader2 size={20} className="text-[#5E6AD2] animate-spin" /></div>
                  )}
                </div>
  );
}

export function GitToolRight({ selectedGitFile, selectedGitCommit, loading, gitDiff, selectedGitType }: any) {
  if (!selectedGitFile && !selectedGitCommit) return <div className="p-8 text-[#555555]">Select a file to view its diff</div>;
  return (
<div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <GitBranch size={24} className="text-[#5E6AD2]" />
                    <h2 className="text-lg font-semibold text-white truncate">
                      {selectedGitCommit ? `Commit: ${selectedGitCommit}` : selectedGitFile}
                    </h2>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#080808] space-y-6">
                  {loading.content ? (
                    <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-[#5E6AD2] animate-spin" /></div>
                  ) : gitDiff ? (
                    <>
                      {gitDiff.commit && selectedGitType === 'commit' && (
                        <div className="space-y-4">
                          <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-xl">
                            <div className="text-[10px] text-[#8A8A8A] font-bold uppercase mb-2">Commit Details</div>
                            <pre className="text-[12px] font-mono text-white whitespace-pre-wrap">{gitDiff.commit.header}</pre>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-widest px-2">Changed Files</div>
                            {gitDiff.commit.files.map((f: any, idx: number) => (
                              <details key={idx} className="group bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl overflow-hidden transition-all">
                                <summary className="px-4 py-3 text-[12px] font-mono text-white cursor-pointer hover:bg-[#161616] flex items-center gap-2 select-none">
                                  <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-[#5E6AD2]" />
                                  <span className="flex-1 truncate">{f.name}</span>
                                </summary>
                                <div className="p-4 bg-[#080808] border-t border-[#1F1F1F] overflow-x-auto">
                                  <pre className="text-[12px] font-mono leading-relaxed whitespace-pre">
                                    {f.patch.split('\n').map((line: string, i: number) => (
                                      <div key={i} className={cn(
                                        line.startsWith('+') && !line.startsWith('+++') ? "text-green-400 bg-green-500/10" : 
                                        line.startsWith('-') && !line.startsWith('---') ? "text-red-400 bg-red-500/10" : 
                                        line.startsWith('diff --git') ? "text-[#5E6AD2] font-bold" :
                                        "text-[#8A8A8A]"
                                      )}>{line}</div>
                                    ))}
                                  </pre>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}
                      {gitDiff.staged && selectedGitType === 'staged' && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-green-500 uppercase tracking-widest px-2">Staged Diff</div>
                          <pre className="bg-[#0D0D0D] border border-green-500/20 p-4 rounded-xl overflow-x-auto text-[12px] font-mono leading-relaxed whitespace-pre">
                            {gitDiff.staged.split('\n').map((line, i) => (
                              <div key={i} className={cn(
                                line.startsWith('+') ? "text-green-400 bg-green-500/10" : 
                                line.startsWith('-') ? "text-red-400 bg-red-500/10" : 
                                "text-[#8A8A8A]"
                              )}>{line}</div>
                            ))}
                          </pre>
                        </div>
                      )}
                      {gitDiff.unstaged && selectedGitType === 'unstaged' && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-yellow-500 uppercase tracking-widest px-2">Unstaged Diff</div>
                          <pre className="bg-[#0D0D0D] border border-yellow-500/20 p-4 rounded-xl overflow-x-auto text-[12px] font-mono leading-relaxed whitespace-pre">
                            {gitDiff.unstaged.split('\n').map((line, i) => (
                              <div key={i} className={cn(
                                line.startsWith('+') ? "text-green-400 bg-green-500/10" : 
                                line.startsWith('-') ? "text-red-400 bg-red-500/10" : 
                                "text-[#8A8A8A]"
                              )}>{line}</div>
                            ))}
                          </pre>
                        </div>
                      )}
                      {gitDiff.untracked && selectedGitType === 'untracked' && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-[#555555] uppercase tracking-widest px-2">Untracked File Content</div>
                          <pre className="bg-[#0D0D0D] border border-[#1F1F1F] p-4 rounded-xl overflow-x-auto text-[12px] font-mono leading-relaxed whitespace-pre">
                            {gitDiff.untracked.split('\n').map((line, i) => (
                              <div key={i} className="text-green-400 bg-green-500/10">{line}</div>
                            ))}
                          </pre>
                        </div>
                      )}
                      {(!gitDiff.staged && !gitDiff.unstaged && !gitDiff.untracked) && (
                        <div className="py-20 text-center text-[#555555] italic">No content available for this file.</div>
                      )}
                    </>
                  ) : (
                    <div className="py-20 text-center text-[#555555] italic">Select a file to view its diff.</div>
                  )}
                </div>
              </div>
  );
}
