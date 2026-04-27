import React from 'react';
import { Play, Loader2, Terminal, HeartPlus, HeartOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CmdToolLeft({ 
  loading, 
  setLoading,
  cmdHistory, 
  setSelectedCmdId, 
  selectedCmdId, 
  setCmdHistory
}: any) {
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [commandInput, setCommandInput] = React.useState('');

  const fetchFavorites = React.useCallback(async () => {
    try {
      const res = await fetch('/api/cmd/favorites');
      const data = await res.json();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  }, []);

  React.useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = async (command: string, isFavorite: boolean) => {
    try {
      const res = await fetch('/api/cmd/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isFavorite ? 'remove' : 'add', command })
      });
      if (res.ok) {
        fetchFavorites();
      }
    } catch (err) {
      console.error('Favorite failed:', err);
    }
  };
  return (
    <div className="space-y-3">
      <div className="px-2 pb-2">
        <div className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-2">Execute Command</div>
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const input = (e.target as any).command;
            const cmd = input.value;
            if (!cmd) return;
            setLoading((prev: any) => ({ ...prev, cmd: true }));
            try {
              const res = await fetch('/api/cmd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
              });
              const data = await res.json();
              setCmdHistory((prev: any) => [data, ...prev].slice(0, 10));
              setSelectedCmdId(data.id);
              setCommandInput('');
              input.value = '';
            } catch (err) { console.error('Cmd execution failed:', err); }
            finally { setLoading((prev: any) => ({ ...prev, cmd: false })); }
          }}
          className="relative"
        >
          <input
            name="command"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="ls -la..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-md px-3 py-2 text-[12px] font-mono text-[#EDEDED] focus:outline-none focus:border-[#5E6AD2]/50 pr-16"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (commandInput) handleToggleFavorite(commandInput, favorites.includes(commandInput));
              }}
              className={cn("p-1 rounded hover:bg-[#1F1F1F] transition-colors text-[#555555]", commandInput && favorites.includes(commandInput) ? "text-red-500" : "")}
            >
              <HeartPlus size={14} className={commandInput && favorites.includes(commandInput) ? "text-red-500" : ""} />
            </button>
            <button 
              type="submit"
              disabled={loading.cmd}
              className="p-1 text-[#5E6AD2] hover:text-white transition-colors disabled:opacity-50"
            >
              {loading.cmd ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-1">
        <div className="px-2 text-[10px] font-bold text-[#5E6AD2] uppercase tracking-widest mb-2">Favorites</div>
        {favorites.map((fav: any, i: number) => (
          <div key={`fav-${i}`} className="group/fav flex items-center gap-1 px-1">
            <button
              onClick={() => setCommandInput(fav)}
              className="flex-1 text-left p-2 rounded-lg bg-[#111111]/40 border border-[#1F1F1F] hover:border-[#5E6AD2]/30 transition-all text-[12px] font-mono text-[#EDEDED] truncate"
              title={fav}
            >
              {fav}
            </button>
            <button
              onClick={() => handleToggleFavorite(fav, true)}
              className="p-1.5 text-[#555555] hover:text-red-500 opacity-0 group-hover/fav:opacity-100 transition-all"
              title="Remove from favorites"
            >
              <HeartOff size={14} />
            </button>
          </div>
        ))}
        {favorites.length === 0 && (
          <div className="px-3 py-4 text-center bg-[#0D0D0D] rounded-lg border border-dashed border-[#1F1F1F]">
            <div className="text-[10px] text-[#555555] italic">No favorites saved</div>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="px-2 text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-2">Recent Commands</div>
        {(cmdHistory || []).map((entry: any) => (
          <div key={entry.id} className="group/recent flex items-center gap-1 px-1">
            <button
              onClick={() => {
                setSelectedCmdId(entry.id);
                setCommandInput(entry.command);
              }}
              className={cn(
                "flex-1 text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                selectedCmdId === entry.id ? "bg-[#111111] border-[#1F1F1F]" : "border-transparent hover:bg-[#111111]/50"
              )}
            >
              <div className={cn(
                "p-1.5 rounded bg-[#161616] border border-[#1F1F1F]",
                entry.exitCode === 0 ? "text-green-500" : "text-red-500"
              )}>
                <Terminal size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-mono text-[#EDEDED] break-all whitespace-pre-wrap leading-tight">{entry.command}</div>
                <div className="text-[10px] text-[#555555] font-mono mt-1" suppressHydrationWarning>
                  {new Date(entry.timestamp).toLocaleTimeString().toLowerCase()}
                </div>
              </div>
            </button>
            <button
              onClick={() => handleToggleFavorite(entry.command, favorites.includes(entry.command))}
              className={cn(
                "p-1.5 transition-all opacity-0 group-hover/recent:opacity-100",
                favorites.includes(entry.command) ? "text-red-500" : "text-[#555555] hover:text-[#5E6AD2]"
              )}
              title={favorites.includes(entry.command) ? "Remove from favorites" : "Add to favorites"}
            >
              {favorites.includes(entry.command) ? <HeartOff size={14} /> : <HeartPlus size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CmdToolRight({ selectedCmd }: any) {
  if (!selectedCmd) return <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[#555555] italic">Execute a command or select from history</div>;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Terminal size={24} className={selectedCmd.exitCode === 0 ? "text-green-500" : "text-red-500"} />
          <h2 className="text-lg font-semibold text-white truncate font-mono">{selectedCmd.command}</h2>
        </div>
        <div className="text-[11px] text-[#555555] font-bold uppercase tracking-wider whitespace-nowrap ml-4">
          Exit Code: {selectedCmd.exitCode}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-[#080808]">
        <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl overflow-hidden shadow-inner">
          <div className="p-4 border-b border-[#1F1F1F] bg-[#111111] flex items-center justify-between">
            <div className="text-[10px] font-bold text-[#666666] uppercase tracking-widest">Output</div>
            <div className="text-[10px] text-[#555555] font-mono" suppressHydrationWarning>
              {new Date(selectedCmd.timestamp).toLocaleString()}
            </div>
          </div>
          <pre className="p-6 text-[13px] font-mono text-[#EDEDED] whitespace-pre-wrap leading-relaxed selection:bg-[#5E6AD2]/40 overflow-x-auto">
            {selectedCmd.output}
          </pre>
        </div>
      </div>
    </div>
  );
}
