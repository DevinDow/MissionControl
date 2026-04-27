import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Edit3, Save, X, Search, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { saveFile } from './utils/fileUtils';

const ListContext = React.createContext<'ordered' | 'unordered' | null>(null);

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

export function FileViewerRight({
  selectedFilePath,
  activeTab,
  isEditing,
  setIsEditing,
  setEditContent,
  fileContent,
  saveLoading,
  setSaveLoading,
  fileSearch,
  setFileSearch,
  setCurrentMatchIndex,
  matchCount,
  setMatchCount,
  currentMatchIndex,
  loading,
  editContent,
  setFileContent
}: any) {
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

  if (!selectedFilePath) return <div className="p-8 text-[#555555]">Select a file to view</div>;

  const handleSaveFile = async () => {
    if (!selectedFilePath) return;
    setSaveLoading(true);
    try {
      await saveFile(selectedFilePath, editContent);
      setFileContent(editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
      alert(`Failed to save: ${(err as Error).message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#5E6AD2]">{selectedFilePath.split('/').pop()}</h2>
          {(activeTab === 'Docs' || activeTab === 'Memory' || activeTab === 'Specs') && !isEditing && (
            <button
              onClick={() => { setEditContent(fileContent); setIsEditing(true); }}
              className="p-1.5 rounded-md hover:bg-[#1F1F1F] text-[#555555] hover:text-[#5E6AD2] transition-all"
              title="Edit File"
            >
              <Edit3 size={16} />
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveFile}
                disabled={saveLoading}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all text-[11px] font-bold uppercase"
              >
                {saveLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-[11px] font-bold uppercase"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64 flex items-center bg-[#111111] border border-[#1F1F1F] rounded-md overflow-hidden focus-within:border-[#5E6AD2]/50">
            <Search size={14} className="ml-2.5 text-[#666666]" />
            <input
              type="text"
              placeholder="Find in file..."
              value={fileSearch}
              onChange={(e) => { setFileSearch(e.target.value); setCurrentMatchIndex(0); }}
              className="w-full bg-transparent px-2 py-1.5 text-[12px] text-[#EDEDED] focus:outline-none"
            />
            {matchCount > 0 && (
              <div className="flex items-center gap-1 px-2 border-l border-[#1F1F1F]">
                <span className="text-[10px] font-mono text-[#555555] whitespace-nowrap">{currentMatchIndex + 1}/{matchCount}</span>
                <button
                  onClick={() => setCurrentMatchIndex((prev: number) => (prev > 0 ? prev - 1 : matchCount - 1))}
                  className="p-0.5 hover:text-[#5E6AD2] transition-colors"
                >
                  <ChevronRight size={14} className="rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentMatchIndex((prev: number) => (prev < matchCount - 1 ? prev + 1 : 0))}
                  className="p-0.5 hover:text-[#5E6AD2] transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-sm max-w-none">
        {loading.content ? <Loader2 size={32} className="text-[#5E6AD2] animate-spin mx-auto mt-20" /> :
          isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full bg-[#080808] text-[#EDEDED] font-mono text-[13px] leading-relaxed p-4 border border-[#1F1F1F] rounded-xl focus:outline-none focus:border-[#5E6AD2]/50 resize-none min-h-[500px]"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSaveFile();
                }
              }}
              spellCheck={false}
              autoFocus
            />
          ) : (selectedFilePath.endsWith('.md') === false) ? (
            <pre className="bg-[#080808] border border-[#1F1F1F] p-6 rounded-xl overflow-x-auto text-[12px] font-mono text-[#EDEDED] leading-relaxed">
              {(() => {
                try {
                  if (selectedFilePath.endsWith('.json')) {
                    const formatted = JSON.stringify(JSON.parse(fileContent), null, 2);
                    return highlightMatches(formatted, fileSearch);
                  }
                  return highlightMatches(fileContent, fileSearch);
                } catch (e) {
                  return highlightMatches(fileContent, fileSearch);
                }
              })()}
            </pre>
          ) : (
            <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
                // h1: Strongest hierarchy, bottom border
                h1: (props) => (
                  <h1 className="text-2xl font-bold text-white mt-12 mb-8 border-b border-[#1F1F1F] pb-4 first:mt-0" {...props}>
                    {highlightMatches(props.children, fileSearch)}
                  </h1>
                ),
                // h2: Left border "accent"
                h2: (props) => (
                  <h2 className="text-lg font-bold text-white mt-8 mb-4 border-l-2 border-[#5E6AD2] pl-4 first:mt-0" {...props}>
                    {highlightMatches(props.children, fileSearch)}
                  </h2>
                ),
                // h3: Indented relative to h2, subtle left border or just padding
                h3: (props) => (
                  <h3 className="text-base font-bold text-white mt-4 mb-3 ml-2 border-l border-gray-700 pl-4 first:mt-0" {...props}>
                    {highlightMatches(props.children, fileSearch)}
                  </h3>
                ),
                // h4: Deeper indentation, no border
                h4: (props) => (
                  <h4 className="text-sm font-bold text-gray-300 mt-2 mb-2 ml-6 first:mt-0" {...props}>
                    {highlightMatches(props.children, fileSearch)}
                  </h4>
                ),
                p: (props) => (
                  <p className="mb-4 leading-relaxed text-gray-400 ml-2 h2:ml-6 h3:ml-10" {...props}>
                    {highlightMatches(props.children, fileSearch)}
                  </p>
                ),
                a: (props) => <a className="text-[#5E6AD2] hover:text-[#4A56C0] underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                table: (props) => (
                  <div className="my-6 overflow-x-auto rounded-lg border border-[#5E6AD2]">
                    <table className="w-full border-collapse text-[13px]" {...props} />
                  </div>
                ),
                thead: (props) => <thead className="bg-[#5E6AD2]/20 border-b border-[#5E6AD2]" {...props} />,
                th: (props) => <th className="px-4 py-2 text-left font-bold text-[#5E6AD2] uppercase tracking-wider border-r border-[#5E6AD2]/60 last:border-r-0" {...props}>{highlightMatches(props.children, fileSearch)}</th>,
                td: (props) => <td className="px-4 py-2 border-t border-r border-[#5E6AD2]/60 last:border-r-0 text-[#EDEDED]" {...props}>{highlightMatches(props.children, fileSearch)}</td>,
                code: ({ node, inline, className, children, ...props }: any) => {
                  const hasNewline = String(children).includes('\n');
                  return (inline || !hasNewline) ? <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-[12px] font-mono text-[#5E6AD2]" {...props}>{highlightMatches(children, fileSearch)}</code> :
                    <pre className="bg-[#080808] border border-[#1F1F1F] p-4 rounded-xl overflow-x-auto my-6 ml-4"><code className={cn("text-[12px] font-mono text-[#EDEDED]", className)} {...props}>{children}</code></pre>;
                },
                ol: ({ node, children, ...props }: any) => (
                  <ListContext.Provider value="ordered">
                    <ol className="list-none [counter-reset:li] mb-4" {...props}>
                      {children}
                    </ol>
                  </ListContext.Provider>
                ),
                ul: ({ node, children, ...props }: any) => (
                  <ListContext.Provider value="unordered">
                    <ul className="list-none mb-4" {...props}>
                      {children}
                    </ul>
                  </ListContext.Provider>
                ),
                li: ({ node, children, ...props }: any) => {
                  const listType = React.useContext(ListContext);
                  return (
                    <li className={cn("flex gap-3 text-[14px] text-[#EDEDED] mb-2", listType === 'ordered' && "[counter-increment:li]")} {...props}>
                      <span className="text-[#5E6AD2] mt-1.5 font-mono min-w-[1.5em] text-right">
                        {listType === 'ordered' ? <span className="before:content-[counter(li)'.']" /> : '•'}
                      </span>
                      <div className="flex-1">
                        {highlightMatches(children, fileSearch)}
                      </div>
                    </li>
                  );
                },
              }}
            >
              {fileContent}
            </ReactMarkdown>
          )
        }
      </div>
    </div>
  );
}
