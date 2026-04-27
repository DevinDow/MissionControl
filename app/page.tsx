"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  HeartPlus,
  HeartOff,
  RefreshCw,
  LayoutGrid,
  Users,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  Brain,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Play,
  Folder,
  File,
  ScrollText,
  Star,
  Activity,
  History,
  Archive,
  Cpu,
  GitBranch,
  Layers,
  MessageSquare,
  Trophy,
  ArrowUpCircle,
  ZapOff,
  Footprints,
  Compass,
  MapPin,
  User,
  Wrench,
  Link as LinkIcon,
  Parentheses,
  Plus,
  Minus,
  Send,
  GitCommit,
  Edit3,
  Save,
  X,
  Code2,
  BrainCog
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatRelativeTime } from './components/tools/utils/dateFormatting';
import { LogsToolLeft, LogsToolRight } from './components/tools/LogsTool';
import { TasksToolLeft, TasksToolRight } from './components/tools/TasksTool';
import { SystemStatus } from './components/SystemStatus';
import { JobsToolLeft, JobsToolRight } from './components/tools/JobsTool';
import { SpecsToolLeft } from './components/tools/SpecsTool';
import { SessionsToolLeft, SessionsToolRight } from './components/tools/SessionsTool';
import { SystemToolLeft } from './components/tools/SystemTool';
import { ScriptsToolLeft } from './components/tools/ScriptsTool';
import { CodeToolLeft } from './components/tools/CodeTool';
import { FileViewerRight } from './components/tools/FileViewer';
import { CmdToolLeft, CmdToolRight } from './components/tools/CmdTool';
import { GitToolLeft, GitToolRight } from './components/tools/GitTool';
import { CalendarToolLeft, CalendarToolRight } from './components/tools/CalendarTool';
import { SkillsToolLeft, SkillsToolRight } from './components/tools/SkillsTool';
import { HelpToolLeft, HelpToolRight } from './components/tools/HelpTool';
import { OldToolLeft } from './components/tools/OldTool';
import { DocsToolLeft } from './components/tools/DocsTool';
import { MemoryToolLeft } from './components/tools/MemoryTool';
import { ModelsToolLeft, ModelsToolRight } from './components/tools/ModelsTool';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MissionControl() {
  // ============================================================================
  // GLOBAL STATE MANAGEMENT
  // ============================================================================

  // Tracks the currently selected tool in the left sidebar (e.g., 'Docs', 'Jobs', 'Sessions')
  const [activeTab, setActiveTab] = useState('Docs');
  const [isMounted, setIsMounted] = useState(false);

  // ============================================================================
  // DATA STATES
  // These arrays hold the raw data fetched from the backend API routes.
  // They populate the middle column lists.
  // ============================================================================
  const [jobs, setJobs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [memoryTree, setMemoryTree] = useState<any[]>([]);
  const [specsTree, setSpecsTree] = useState<any[]>([]);
  const [docsTree, setDocsTree] = useState<any[]>([]);
  const [oldTree, setOldTree] = useState<any[]>([]);
  const [systemTree, setSystemTree] = useState<any[]>([]);
  const [scriptsTree, setScriptsTree] = useState<any[]>([]);
  const [codeTree, setCodeTree] = useState<any[]>([]);
  const [codeFolderData, setCodeFolderData] = useState<Record<string, any[]>>({});
  const [expandedCodeFolders, setExpandedCodeFolders] = useState<Set<string>>(new Set());
  const [expandedSystemFolders, setExpandedSystemFolders] = useState<Set<string>>(new Set());
  const [expandedDocsFolders, setExpandedDocsFolders] = useState<Set<string>>(new Set(["__VIRTUAL__/README", "__VIRTUAL__/WORKSPACE", "plans"]));
  const [cmdHistory, setCmdHistory] = useState<any[]>([]);
  const [gitStatus, setGitStatus] = useState<{
    commits: any[],
    branch?: string,
    aheadCount: number,
    remoteHash?: string,
    staged: string[],
    unstaged: string[],
    untracked: string[]
  } | null>(null);
  const [modelStatus, setModelStatus] = useState<{
    modelId?: string,
    provider?: string,
    host?: string,
    modelName?: string,
    sessionFile?: string
  } | null>(null);
  const [helpLinks, setHelpLinks] = useState<any[]>([]);
  const [helpShortcuts, setHelpShortcuts] = useState<any[]>([]);
  const [helpCli, setHelpCli] = useState<string>('');
  const [skills, setSkills] = useState<{ workspace: any[], system: any[] }>({ workspace: [], system: [] });
  const [healthLog, setHealthLog] = useState<string>('');
  const [modelHealthLog, setModelHealthLog] = useState<string>('');
  const [modelsData, setModelsData] = useState<any>(null);

  // Stores the user's input for the middle column search/filter bar
  const [filterText, setFilterText] = useState<string>('');

  // Tracks the overall health of the OpenClaw system (Online status, heartbeat, versions)
  const [selectedLog, setSelectedLog] = useState<string>('system_health_log');
  const [gatewayStatus, setGatewayStatus] = useState<{
    online: boolean,
    version?: string,
    updateAvailable?: boolean,
    latestVersion?: string,
    channel?: string,
    heartbeatInterval?: string,
    heartbeatActiveHours?: {
      start: string,
      end: string,
      timezone?: string
    } | null,
    lastHeartbeat?: {
      ts?: number,
      status?: string,
      silent?: boolean,
      reason?: string,
      durationMs?: number,
      channel?: string,
      accountId?: string,
      indicatorType?: string,
      lastHeartbeatText?: string | null
    }
  }>({ online: true });

  const [updating, setUpdating] = useState<boolean>(false);

  // ============================================================================
  // LOADING STATES
  // Map of booleans used to trigger the spinning Loader2 icons across the UI
  // ============================================================================
  const [loading, setLoading] = useState<Record<string, boolean>>({
    jobs: false,
    tasks: false,
    calendar: false,
    sessions: false,
    files: false,
    content: false,
    logs: false,
    heartbeat: false,
    models: false
  });

  // ============================================================================
  // SELECTION STATES
  // These track what the user has clicked in the middle column.
  // Changes to these states trigger the 'fetchContent' useEffect to load details.
  // ============================================================================
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>('__TODO__/TODO.md');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCmdId, setSelectedCmdId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [selectedSkillFile, setSelectedSkillFile] = useState<string>('SKILL.md');
  const [selectedHelpId, setSelectedHelpId] = useState<string | null>(null);
  const [selectedGitFile, setSelectedGitFile] = useState<string | null>(null);
  const [selectedGitType, setSelectedGitType] = useState<'staged' | 'unstaged' | 'untracked' | 'commit' | null>(null);
  const [selectedGitCommit, setSelectedGitCommit] = useState<string | null>(null);
  const [gitDiff, setGitDiff] = useState<{ staged: string | null, unstaged: string | null, untracked: string | null, commit: { header: string, files: any[] } | null } | null>(null);
  const [gitFingerprint, setGitFingerprint] = useState<string | null>(null);
  const [gitStale, setGitStale] = useState<boolean>(false);
  const [viewingJobLog, setViewingJobLog] = useState<boolean>(false);

  // The raw text/markdown content fetched from the server for the Right Column
  const [fileContent, setFileContent] = useState<string>('');

  // Controls how many JSONL entries are parsed in Session Logs (Performance optimization)
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [history, setHistory] = useState<any[]>([]);

  // Right-column internal "Find in file" search states
  const [fileSearch, setFileSearch] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);

  // Session-specific search
  const [sessionSearch, setSessionSearch] = useState<string>('');

  // Tracks if the currently viewed session log has new data on the server
  const [sessionStale, setSessionStale] = useState<boolean>(false);
  const [sessionNewLineCount, setSessionNewLineCount] = useState<number>(0);
  const [currentLinesCount, setCurrentLinesCount] = useState<number>(0);
  const [contentLoadedAt, setContentLoadedAt] = useState<number>(0);
  const [contentError, setContentError] = useState<string | null>(null);

  // Live Editing States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // ============================================================================
  // HANDLERS & HELPERS
  // ============================================================================

  const navigateToSession = (sessionId: string, targetTab: 'Sessions' | 'History' = 'Sessions') => {
    setActiveTab(targetTab);
    setSelectedSessionId(sessionId);
  };

  const navigateToModel = (modelId: string) => {
    setActiveTab('Models');
    const modelMatch = modelsData?.models?.find((m: any) => m.id === modelId) || null;
    setSelectedModel(modelMatch);
  };

  const navItems = [
    { name: 'Docs', icon: FileText },
    { name: 'Memory', icon: Brain },
    { name: 'Models', icon: BrainCog },
    { name: 'Jobs', icon: Clock },
    { name: 'Specs', icon: ScrollText },
    { name: 'Logs', icon: Activity },
    { name: 'Sessions', icon: Users },
    { name: 'History', icon: History },
    { name: 'System', icon: Settings },
    { name: 'Scripts', icon: Parentheses },
    { name: 'Code', icon: Code2 },
    { name: 'Cmd', icon: Terminal },
    { name: 'Git', icon: GitBranch },
    { name: 'Calendar', icon: CalendarIcon },
    { name: 'Tasks', icon: CheckSquare },
    { name: 'Skills', icon: Wrench },
    { name: 'Help', icon: HelpCircle },
    { name: 'Old', icon: Archive },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Search on "/"
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Filter"], input[placeholder*="Find"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Clear Selection on "Esc"
      if (e.key === 'Escape') {
        setSelectedFilePath(null);
        setSelectedSessionId(null);
        setSelectedTaskId(null);
        setSelectedEventId(null);
        setSelectedSkillId(null);
        setSelectedHelpId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async (endpoint: string, setter: Function, loadingKey: string) => {
    const fetchStart = Date.now();
    if (endpoint.includes('sessions') || endpoint.includes('history') || endpoint.includes('content')) {
      console.log(`[Frontend] Fetching ${endpoint} ...`);
    }
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (endpoint.includes('sessions') || endpoint.includes('history') || endpoint.includes('content')) {
        console.log(`[Frontend] Fetched ${endpoint} in ${Date.now() - fetchStart}ms`);
      }
      if (endpoint.startsWith('/api/logs')) {
        if (endpoint.includes('logType=system')) {
          setHealthLog(data.content || '');
        } else if (endpoint.includes('logType=model')) {
          setModelHealthLog(data.content || '');
        }
      } else if (endpoint === '/api/cmd') {
        setter(data);
        return data;
      } else if (endpoint === '/api/git' || endpoint === '/api/model' || endpoint === '/api/skills' || endpoint === '/api/models' || endpoint === '/api/status' || endpoint === '/api/heartbeat' || endpoint === '/api/heartbeat/last' || endpoint === '/api/online' || endpoint === '/api/update' || endpoint.startsWith('/api/help')) {
        setter(data);
        return data;
      } else {
        const finalData = Array.isArray(data) ? data : (data.sessions || data.jobs || []);
        setter(finalData);
        return finalData;
      }
      return data;
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      // Don't set empty array for status or skills which are objects
      if (endpoint === '/api/status') {
        setter({ online: false, error: 'Connection failed' });
      } else if (endpoint === '/api/skills') {
        setter({ workspace: [], system: [] });
      } else if (endpoint === '/api/model') {
        setter({ provider: '?', host: '?', modelName: 'Error loading' });
      } else {
        setter([]);
      }
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleRefreshSession = async () => {
    if (!selectedSessionId) return;

    const refreshStart = Date.now();
    console.log(`[Frontend] handleRefreshSession start for id: ${selectedSessionId}`);

    setSessionStale(false);
    setSessionNewLineCount(0);
    setContentLoadedAt(Date.now());
    // Clear content first for visual feedback
    setFileContent('');
    setLoading(prev => ({ ...prev, content: true }));

    try {
      // 2. Re-fetch session list to update metadata (Size/Updated)
      const res = await fetch(`/api/sessions/content?id=${selectedSessionId}`);
      const data = await res.json();
      console.log(`[Frontend] handleRefreshSession fetched content in ${Date.now() - refreshStart}ms`);

      setFileContent(data.content || '');
      const lines = (data.content || '').split('\n').filter((l: string) => l.trim());
      setCurrentLinesCount(lines.length);

      // Surgically update the metadata in the sidebar without a full list reload
      if (data.metadata) {
        setSessions(prev => prev.map(s =>
          s.sessionId === selectedSessionId
            ? { ...s, size: data.metadata.size, updatedAt: data.metadata.updatedAt }
            : s
        ));
      }
      setSessionStale(false);
    } catch (err) {
      console.error('Surgical refresh error:', err);
    } finally {
      setLoading(prev => ({ ...prev, content: false }));
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Initial data load for all tools
    fetchData('/api/jobs', setJobs, 'jobs').then(data => {
      if (Array.isArray(data) && data.length > 0) setSelectedJobId(data[0].id);
    });
    fetchData('/api/files?mode=memory', setMemoryTree, 'files').then(data => {
      if (Array.isArray(data) && data.length > 0 && activeTab === 'Memory') {
        const firstFile = data[0].type === 'file' ? data[0] : data[0].children?.[0];
        if (firstFile) setSelectedFilePath(firstFile.path);
      }
    });
    fetchData('/api/files?mode=specs', setSpecsTree, 'files');
    fetchData('/api/files?mode=docs', setDocsTree, 'files');
    fetchData('/api/files?mode=old', setOldTree, 'files');
    fetchData('/api/system', setSystemTree, 'files');
    fetchData('/api/scripts', setScriptsTree, 'files');
    fetchData('/api/tasks', setTasks, 'tasks');
    fetchData('/api/calendar', setEvents, 'calendar');
    fetchData('/api/sessions', setSessions, 'sessions');
    fetchData('/api/history', setHistory, 'history');
    fetchData('/api/skills', setSkills, 'skills');
    fetchData('/api/logs?logType=system', setHealthLog, 'logs');
    fetchData('/api/logs?logType=model', setModelHealthLog, 'logs');
    fetchData('/api/git', setGitStatus, 'git');
    fetchData('/api/model', setModelStatus, 'model');
    fetchData('/api/help/links', setHelpLinks, 'help');
    fetchData('/api/help/shortcuts', setHelpShortcuts, 'help');
    fetchData('/api/help/cli', (data: any) => setHelpCli(data.content), 'help');
    fetchData('/api/models', setModelsData, 'models');

    // 1. Online Check: lightweight connectivity probe (No console.log)
    fetchData('/api/online', (data: any) => setGatewayStatus(prev => ({ ...prev, online: data.online })), 'status');

    // 2. Heartbeat Config (lightweight) + Last Event (heavy, called separately)
    fetchData('/api/heartbeat', (data: any) => {
      console.log('Heartbeat config:', data);
      // Store just the config for now; will merge with last event
      setGatewayStatus(prev => ({
        ...prev,
        heartbeatInterval: data.interval,
        heartbeatActiveHours: data.activeHours ?? null
      }));
    }, 'status');

    // Fetch last heartbeat event separately (heavier operation)
    fetchData('/api/heartbeat/last', (data: any) => {
      console.log('Last heartbeat:', data);
      if (data?.ts) {
        setGatewayStatus(prev => ({
          ...prev,
          lastHeartbeat: {
            ts: data.ts,
            status: data.status,
            silent: data.silent,
            reason: data.reason,
            durationMs: data.durationMs,
            channel: data.channel,
            accountId: data.accountId,
            indicatorType: data.indicatorType,
            lastHeartbeatText: data.lastHeartbeatText ?? null
          }
        }));
      }
    }, 'heartbeat');

    // 3. Status Check: full gateway metadata (version, runtime info, etc.)
    fetchData('/api/status', (data: any) => {
      console.log('Status check:', data);
      setGatewayStatus(prev => ({ ...prev, version: data?.runtimeVersion }));
    }, 'status');

    // 4. Update Check: checks for newer registry versions (6h interval)
    fetchData('/api/update', (data: any) => {
      console.log('Update check:', data);
      setGatewayStatus(prev => ({
        ...prev,
        latestVersion: data.latestVersion,
        updateAvailable: data.updateAvailable,
        channel: data.channel
      }));
    }, 'status');

    // Interval 1: High-Performance Online Check (10s, No console.log)
    const onlineInterval = setInterval(() => {
      fetch('/api/online')
        .then(res => res.json())
        .then(data => {
          setGatewayStatus(prev => {
            const wasOffline = prev.online === false;
            const isNowOnline = data.online === true;

            // If it just came back online, re-check system/update status
            if (wasOffline && isNowOnline) {
              fetchData('/api/status', (data: any) => setGatewayStatus(prev => ({ ...prev, version: data?.runtimeVersion })), 'status');
              fetchData('/api/update', (data: any) => setGatewayStatus(prev => ({
                ...prev,
                latestVersion: data.latestVersion,
                updateAvailable: data.updateAvailable,
                channel: data.channel
              })), 'status');
            }

            return { ...prev, online: data.online };
          });
        })
        .catch(() => { });
    }, 10000);

    // Interval 2: Heartbeat Check (10m) - only fetch the heavy /last endpoint infrequently
    const heartbeatInterval = setInterval(() => {
      fetchData('/api/heartbeat/last', (data: any) => {
        console.log('Heartbeat check (interval):', data);
        if (data?.ts) {
          setGatewayStatus(prev => ({
            ...prev,
            lastHeartbeat: {
              ts: data.ts,
              status: data.status,
              silent: data.silent,
              reason: data.reason,
              durationMs: data.durationMs,
              channel: data.channel,
              accountId: data.accountId,
              indicatorType: data.indicatorType,
              lastHeartbeatText: data.lastHeartbeatText ?? null
            }
          }));
        }
      }, 'heartbeat');
    }, 600000);

    // Interval 3: Update Check (6h)
    const updateInterval = setInterval(() => {
      fetchData('/api/update', (data: any) => {
        console.log('Update check (interval):', data);
        setGatewayStatus(prev => ({
          ...prev,
          latestVersion: data.latestVersion,
          updateAvailable: data.updateAvailable,
          channel: data.channel
        }));
      }, 'status');
    }, 21600000);

    // Interval 4: Full Session List Refresh (60s) - Slower to save CPU
    const listInterval = setInterval(() => {
      const currentTab = activeTab;
      if (currentTab === 'Sessions' || currentTab === 'History') {
        fetch('/api/sessions')
          .then(res => res.json())
          .then(data => {
            const sessionsList = Array.isArray(data) ? data : (data.sessions || []);
            setSessions(sessionsList);
          })
          .catch(() => { });
      }
    }, 60000);

    // Interval 5: Git Status Refresh (60s) - Always on
    const gitStatusInterval = setInterval(() => {
      fetch('/api/git')
        .then(res => res.json())
        .then(data => setGitStatus(data))
        .catch(() => { });
    }, 60000);

    // Interval 6: Model Status Refresh (60s) - Always on
    const modelStatusInterval = setInterval(() => {
      fetch('/api/model')
        .then(res => res.json())
        .then(data => setModelStatus(data))
        .catch(() => { });
    }, 60000);

    return () => {
      clearInterval(onlineInterval);
      clearInterval(heartbeatInterval);
      clearInterval(updateInterval);
      clearInterval(listInterval);
      clearInterval(gitStatusInterval);
      clearInterval(modelStatusInterval);
    };
  }, [activeTab]);

  // Interval 5: Git Pulse Polling (2s) - Only when Git tab is active
  useEffect(() => {
    if (activeTab !== 'Git') return;

    const gitPulseInterval = setInterval(() => {
      fetch('/api/git/pulse')
        .then(res => res.json())
        .then(data => {
          if (data.fingerprint && gitFingerprint && data.fingerprint !== gitFingerprint) {
            setGitStale(true);
          } else if (data.fingerprint && !gitFingerprint) {
            setGitFingerprint(data.fingerprint);
          }
        })
        .catch(() => { });
    }, 2000);

    return () => clearInterval(gitPulseInterval);
  }, [activeTab, gitFingerprint]);

  // Handle Git stale state by auto-refreshing
  useEffect(() => {
    if (gitStale && activeTab === 'Git') {
      fetchData('/api/git', setGitStatus, 'git').then(data => {
        if (data) {
          setGitStatus(data);
          fetch('/api/git/pulse').then(r => r.json()).then(d => {
            setGitFingerprint(d.fingerprint);
            setGitStale(false);
          }).catch(() => { });
        }
      });
    }
  }, [gitStale, activeTab]);

  // targeted Staleness Polling for Active Session (2s)
  useEffect(() => {
    if (!selectedSessionId || !isMounted) return;

    const interval = setInterval(() => {
      if (contentLoadedAt > 0) {
        fetch(`/api/sessions/timestamp?id=${selectedSessionId}`)
          .then(res => res.json())
          .then(data => {
            if (data.updatedAt > contentLoadedAt + 2000) {
              setSessionStale(true);
              if (data.lineCount > currentLinesCount) {
                setSessionNewLineCount(data.lineCount - currentLinesCount);
              }

              // Only update the sidebar if the timestamp is actually newer than what we currently show
              setSessions(prev => {
                const session = prev.find(s => s.sessionId === selectedSessionId);
                if (session && session.updatedAt < data.updatedAt) {
                  return prev.map(s =>
                    s.sessionId === selectedSessionId
                      ? { ...s, updatedAt: data.updatedAt }
                      : s
                  );
                }
                return prev;
              });
            }
          })
          .catch(() => { });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedSessionId, contentLoadedAt, isMounted]);

  useEffect(() => {
    if (!selectedSessionId || !isMounted) return;

    const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
    if (currentSession && fileContent && contentLoadedAt > 0) {
      if (currentSession.updatedAt > contentLoadedAt + 2000) {
        setSessionStale(true);
      }
    }
  }, [sessions, selectedSessionId, fileContent, contentLoadedAt]);

  // Consolidated content fetcher
  useEffect(() => {
    async function fetchContent() {
      // 1. CLEAR previous content while loading
      setFileContent('');
      setContentError(null);
      setGitDiff(null);
      setIsEditing(false);
      setSessionStale(false);
      setSessionNewLineCount(0);
      setContentLoadedAt(Date.now());

      // 2. Resolve URL based on state
      let url = '';
      if ((activeTab === 'Sessions' || activeTab === 'History') && selectedSessionId) {
        url = `/api/sessions/content?id=${selectedSessionId}`;
      } else if (activeTab === 'Jobs' && selectedJobId && viewingJobLog) {
        const job = jobs.find(j => j.id === selectedJobId);
        if (job?.state?.lastSessionId) {
          url = `/api/sessions/content?id=${job.state.lastSessionId}`;
        }
      } else if (activeTab === 'Git' && selectedGitCommit) {
        url = `/api/git/diff?commit=${selectedGitCommit}`;
      } else if (activeTab === 'Git' && selectedGitFile) {
        url = `/api/git/diff?file=${encodeURIComponent(selectedGitFile)}`;
      } else if (activeTab === 'Code' && selectedFilePath) {
        url = `/api/files/content?path=__TOOLS__/${encodeURIComponent(selectedFilePath)}`;
      } else if (activeTab === 'Skills' && selectedSkillId) {
        const [origin, name] = selectedSkillId.split(':');
        url = `/api/skills/content?origin=${origin}&name=${encodeURIComponent(name)}&filename=${encodeURIComponent(selectedSkillFile || 'SKILL.md')}`;
      } else if (activeTab === 'Scripts' && selectedFilePath) {
        url = `/api/scripts/content?path=${encodeURIComponent(selectedFilePath)}`;
      } else if (activeTab === 'System' && selectedFilePath) {
        url = `/api/system/content?path=${encodeURIComponent(selectedFilePath)}`;
      } else if (['Memory', 'Specs', 'Docs', 'Old'].includes(activeTab) && selectedFilePath) {
        url = `/api/files/content?path=${encodeURIComponent(selectedFilePath)}`;
      }

      if (!url) return;

      setLoading(prev => ({ ...prev, content: true }));

      try {
        const res = await fetch(url);
        let data: any;

        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }

        if (!res.ok) {
          setContentError(data?.error || `Error ${res.status}: ${res.statusText}`);
          setLoading(prev => ({ ...prev, content: false }));
          return;
        }

        if (activeTab === 'Git') {
          if (selectedGitCommit) {
            setGitDiff({ staged: null, unstaged: null, untracked: null, commit: data });
          } else {
            setGitDiff({ staged: data.staged, unstaged: data.unstaged, untracked: data.untracked, commit: null });
          }
        } else {
          setFileContent(data.content || '');
          if (activeTab === 'Sessions' || activeTab === 'History') {
            const lines = (data.content || '').split('\n').filter((l: string) => l.trim());
            setCurrentLinesCount(lines.length);
          }
        }

        // Handle Session metadata update
        if (activeTab === 'Sessions' && data.metadata) {
          setSessions(prev => prev.map(s => s.sessionId === selectedSessionId ? { ...s, size: data.metadata.size, updatedAt: data.metadata.updatedAt } : s));
        }
      } catch (err) {
        console.error(`Fetch failed:`, err);
        setContentError('Failed to load content.');
      } finally {
        setLoading(prev => ({ ...prev, content: false }));
      }
    }

    fetchContent();
  }, [selectedFilePath, selectedSessionId, selectedSkillId, selectedSkillFile, activeTab, historyLimit, viewingJobLog, selectedGitFile, selectedGitCommit, gitFingerprint]);

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId || s.fileId === selectedSessionId || s.id === selectedSessionId) || history.find(s => s.fileId === selectedSessionId || s.id === selectedSessionId);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedSkill = (skills?.workspace || []).find(s => s.id === selectedSkillId) || (skills?.system || []).find(s => s.id === selectedSkillId);
  const selectedCmd = (cmdHistory || []).find(c => c.id === selectedCmdId);

  const matchesFilter = (text: string) => {
    if (!filterText) return true;
    if (!text) return false;
    return text.toLowerCase().includes(filterText.toLowerCase());
  };

  const renderFileTree = (nodes: any[], isSystem = false, isDocs = false) => {
    return nodes.map((node) => {
      if (node.type === 'directory') {
        const isExpanded = isSystem ? expandedSystemFolders.has(node.path) : (isDocs ? expandedDocsFolders.has(node.path) : true);
        const children = renderFileTree(node.children, isSystem, isDocs);
        const hasVisibleChildren = children.some(c => c !== null);
        if (!hasVisibleChildren && filterText) return null;

        if (isSystem || isDocs) {
          return (
            <div key={node.path}>
              <button
                onClick={() => {
                  const setter = isSystem ? setExpandedSystemFolders : setExpandedDocsFolders;
                  setter(prev => {
                    const next = new Set(prev);
                    if (next.has(node.path)) next.delete(node.path);
                    else next.add(node.path);
                    return next;
                  });
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold transition-all hover:bg-[#111111]/50 group",
                  isExpanded ? "text-[#5E6AD2]" : "text-[#555555]"
                )}
              >
                <ChevronRight size={12} className={cn("transition-transform", isExpanded ? "rotate-90" : "")} />
                <Folder size={12} />
                <span className="uppercase tracking-wider">{node.name}</span>
              </button>
              {isExpanded && (
                <div className="ml-2 border-l border-[#1F1F1F]">
                  {children}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={node.path}>
            <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">
              <Folder size={12} />
              {node.name}
            </div>
            <div className="ml-2 border-l border-[#1F1F1F]">
              {children}
            </div>
          </div>
        );
      } else {
        if (!matchesFilter(node.name)) return null;
        return (
          <button
            key={node.path}
            onClick={() => { setSelectedFilePath(node.path); setSelectedSessionId(null); setSelectedTaskId(null); setSelectedEventId(null); }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex flex-col gap-0.5 border border-transparent group",
              selectedFilePath === node.path
                ? "bg-[#111111] text-white border-[#1F1F1F]"
                : "text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#111111]/50"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <FileText size={14} className={cn(
                "shrink-0 transition-colors",
                selectedFilePath === node.path ? "text-[#5E6AD2]" : "text-[#666666] group-hover:text-[#8A8A8A]"
              )} />
              <span className={cn("truncate flex-1", node.isArchived && "line-through")}>{node.name}</span>
            </div>
            {node.updatedAt && (() => {
              const { text, color } = formatRelativeTime(node.updatedAt);
              return (
                <div className={cn("text-[10px] font-mono ml-5 transition-colors", color)} suppressHydrationWarning>
                  {text}
                </div>
              );
            })()}
          </button>
        );
      }
    });
  };



  // Dynamic tool rendering
  const renderLeft = () => {
    switch (activeTab) {
      case 'Logs': return <LogsToolLeft fetchData={fetchData} setHealthLog={setHealthLog} setModelHealthLog={setModelHealthLog} selectedLog={selectedLog} setSelectedLog={setSelectedLog} />;
      case 'Tasks': return <TasksToolLeft tasks={tasks} matchesFilter={matchesFilter} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} setSelectedJobId={setSelectedJobId} setSelectedFilePath={setSelectedFilePath} setSelectedEventId={setSelectedEventId} />;
      case 'Jobs': return <JobsToolLeft jobs={jobs} matchesFilter={matchesFilter} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} setSelectedTaskId={setSelectedTaskId} setSelectedEventId={setSelectedEventId} setViewingJobLog={setViewingJobLog} />;
      case 'Specs': return <SpecsToolLeft specsTree={specsTree} renderFileTree={renderFileTree} />;
      case 'Sessions': return <SessionsToolLeft sessions={sessions} matchesFilter={matchesFilter} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} setSelectedFilePath={setSelectedFilePath} setSelectedTaskId={setSelectedTaskId} setSelectedEventId={setSelectedEventId} setHistoryLimit={setHistoryLimit} setSessionSearch={setSessionSearch} handleRefresh={() => fetchData('/api/sessions', setSessions, 'sessions')} isRefreshing={loading.sessions} />;
      case 'History':
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneWeekMs = 7 * oneDayMs;

        const filteredHistory = history.filter(h => {
          const isWithinWeek = h.updatedAt >= (now - oneWeekMs);
          return isWithinWeek;
        });

        return <SessionsToolLeft sessions={filteredHistory} matchesFilter={matchesFilter} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} setSelectedFilePath={setSelectedFilePath} setSelectedTaskId={setSelectedTaskId} setSelectedEventId={setSelectedEventId} setHistoryLimit={setHistoryLimit} setSessionSearch={setSessionSearch} handleRefresh={() => fetchData('/api/history', setHistory, 'history')} isRefreshing={loading.history} />;
      case 'System': return <SystemToolLeft systemTree={systemTree} renderFileTree={renderFileTree} />;
      case 'Scripts': return <ScriptsToolLeft scriptsTree={scriptsTree} renderFileTree={renderFileTree} setActiveTab={setActiveTab} />;
      case 'Code': return <CodeToolLeft loading={loading} setLoading={setLoading} codeFolderData={codeFolderData} setCodeFolderData={setCodeFolderData} expandedCodeFolders={expandedCodeFolders} setExpandedCodeFolders={setExpandedCodeFolders} codeTree={codeTree} setCodeTree={setCodeTree} fetchData={fetchData} matchesFilter={matchesFilter} selectedFilePath={selectedFilePath} setSelectedFilePath={setSelectedFilePath} setSelectedSessionId={setSelectedSessionId} setSelectedTaskId={setSelectedTaskId} setSelectedEventId={setSelectedEventId} />;
      case 'Cmd': return <CmdToolLeft setLoading={setLoading} loading={loading} cmdHistory={cmdHistory} setCmdHistory={setCmdHistory} setSelectedCmdId={setSelectedCmdId} selectedCmdId={selectedCmdId} />;
      case 'Git': return <GitToolLeft gitStatus={gitStatus} selectedGitFile={selectedGitFile} setSelectedGitFile={setSelectedGitFile} selectedGitType={selectedGitType} setSelectedGitType={setSelectedGitType} setSelectedGitCommit={setSelectedGitCommit} gitStale={gitStale} selectedGitCommit={selectedGitCommit} setGitDiff={setGitDiff} refreshGitStatus={async () => {
        const data = await fetchData('/api/git', setGitStatus, 'git');
        if (data) {
          setGitStatus(data);
          fetch('/api/git/pulse').then(r => r.json()).then(d => {
            setGitFingerprint(d.fingerprint);
            setGitStale(false);
          }).catch(() => { });
        }
      }} />;
      case 'Calendar': return <CalendarToolLeft events={events} matchesFilter={matchesFilter} setSelectedEventId={setSelectedEventId} setSelectedJobId={setSelectedJobId} setSelectedFilePath={setSelectedFilePath} setSelectedTaskId={setSelectedTaskId} selectedEventId={selectedEventId} />;
      case 'Skills': return <SkillsToolLeft skills={skills} matchesFilter={matchesFilter} setSelectedSkillId={setSelectedSkillId} setSelectedSkillFile={setSelectedSkillFile} setSelectedJobId={setSelectedJobId} setSelectedFilePath={setSelectedFilePath} setSelectedTaskId={setSelectedTaskId} setSelectedEventId={setSelectedEventId} setSelectedSessionId={setSelectedSessionId} selectedSkillId={selectedSkillId} />;
      case 'Help': return <HelpToolLeft setSelectedHelpId={setSelectedHelpId} setSelectedJobId={setSelectedJobId} setSelectedFilePath={setSelectedFilePath} setSelectedTaskId={setSelectedTaskId} setSelectedEventId={setSelectedEventId} setSelectedSessionId={setSelectedSessionId} selectedHelpId={selectedHelpId} />;
      case 'Old': return <OldToolLeft oldTree={oldTree} renderFileTree={renderFileTree} />;
      case 'Docs': return <DocsToolLeft docsTree={docsTree} renderFileTree={renderFileTree} />;
      case 'Models': return <ModelsToolLeft modelsData={modelsData} modelsLoading={loading.models} onSelectModel={setSelectedModel} selectedModelId={selectedModel?.id} />;
      case 'Memory': return <MemoryToolLeft memoryTree={memoryTree} renderFileTree={renderFileTree} />;
      default: return null;
    }
  };

  const renderRight = () => {
    switch (activeTab) {
      case 'Logs': return <LogsToolRight healthLog={healthLog} modelHealthLog={modelHealthLog} loading={loading} selectedLog={selectedLog} />;
      case 'Tasks': return <TasksToolRight selectedTask={selectedTask} />;
      case 'Jobs': return <JobsToolRight selectedJob={selectedJob} viewingJobLog={viewingJobLog} setViewingJobLog={setViewingJobLog} fileContent={fileContent} historyLimit={historyLimit} loading={loading} setActiveTab={setActiveTab} setSelectedFilePath={setSelectedFilePath} refreshJobs={() => fetchData('/api/jobs', setJobs, 'jobs')} />;
      case 'Specs': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Sessions': return <SessionsToolRight selectedSession={selectedSession} loading={loading} fileContent={fileContent} contentError={contentError} historyLimit={historyLimit} setHistoryLimit={setHistoryLimit} sessionSearch={sessionSearch} setSessionSearch={setSessionSearch} sessionStale={sessionStale} sessionNewLineCount={sessionNewLineCount} handleRefreshSession={handleRefreshSession} activeTab={activeTab} onNavigateToModel={navigateToModel} />;
      case 'History': return <SessionsToolRight selectedSession={selectedSession} loading={loading} fileContent={fileContent} contentError={contentError} historyLimit={historyLimit} setHistoryLimit={setHistoryLimit} sessionSearch={sessionSearch} setSessionSearch={setSessionSearch} sessionStale={sessionStale} sessionNewLineCount={sessionNewLineCount} handleRefreshSession={handleRefreshSession} activeTab={activeTab} onNavigateToModel={navigateToModel} />;
      case 'System': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Scripts': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Code': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Cmd': return <CmdToolRight selectedCmd={selectedCmd} />;
      case 'Git': return <GitToolRight selectedGitFile={selectedGitFile} selectedGitCommit={selectedGitCommit} loading={loading} gitDiff={gitDiff} selectedGitType={selectedGitType} />;
      case 'Calendar': return <CalendarToolRight selectedEvent={selectedEvent} />;
      case 'Skills': return <SkillsToolRight selectedSkill={selectedSkill} selectedSkillFile={selectedSkillFile} setSelectedSkillFile={setSelectedSkillFile} loading={loading} fileContent={fileContent} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} />;
      case 'Help': return <HelpToolRight selectedHelpId={selectedHelpId} helpLinks={helpLinks} helpShortcuts={helpShortcuts} helpCli={helpCli} gatewayStatus={gatewayStatus} />;
      case 'Old': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Models': return <ModelsToolRight selectedModel={selectedModel} allSessions={history} onNavigateToSession={navigateToSession} platform={modelsData?.platform} />;
      case 'Docs': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Memory': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      default: return <div className="p-8 text-[#555555]">Select a tool</div>;
    }
  };

  const clearSelection = () => {
    setSelectedFilePath(null);
    setSelectedSessionId(null);
    setSelectedTaskId(null);
    setSelectedEventId(null);
    setSelectedSkillId(null);
    setSelectedHelpId(null);
    setSelectedGitCommit(null);
    setSelectedGitFile(null);
    setSelectedCmdId(null);
    setSelectedModel(null);
  };

  const hasSelection = !!(
    selectedFilePath ||
    selectedSessionId ||
    selectedTaskId ||
    selectedEventId ||
    selectedSkillId ||
    selectedModel ||
    selectedHelpId ||
    selectedGitCommit ||
    selectedGitFile ||
    selectedCmdId
  );

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-[#5E6AD2]/30">
      {/* Sidebar */}
      <aside className="flex w-[60px] md:w-[240px] bg-[#080808] flex-col border-r border-[#1F1F1F] h-screen overflow-hidden">
        <div className="p-2 md:p-4 flex items-center gap-0 md:gap-3 mb-2 shrink-0 justify-center md:justify-start">
          <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center bg-[#111111] border border-[#1F1F1F] shrink-0">
            <img src="/avatars/darvis_head.jpg" alt="Darvis" className="w-full h-full object-cover" />
          </div>
          <span className="hidden md:block text-[13px] font-semibold tracking-tight text-[#5E6AD2] truncate">Mission Control</span>
        </div>

        <nav className="flex-1 px-1.5 md:px-2 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1F1F1F] scrollbar-track-transparent">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                setFilterText(''); // Clear filter when switching tabs
                setFileSearch(''); // Clear search when switching tabs
                setMatchCount(0); // Reset match count when switching tabs
                setCurrentMatchIndex(0); // Reset match index when switching tabs
                setSelectedFilePath(null); // Clear file selection when switching tools
                setSelectedSessionId(null);
                setSelectedTaskId(null);
                setSelectedEventId(null);
                setSelectedSkillId(null);
                setViewingJobLog(false);

                // Pre-selections for better UX
                if (item.name === 'Cmd') {
                  if (cmdHistory.length === 0) {
                    fetchData('/api/cmd', setCmdHistory, 'cmd');
                  }
                  setSelectedCmdId(null);
                }
                if (item.name === 'Git') {
                  setGitStale(false);
                  fetch('/api/git/pulse').then(r => r.json()).then(d => setGitFingerprint(d.fingerprint)).catch(() => { });
                }
                if (item.name === 'Code') {
                  fetchData('/api/code', setCodeTree, 'code');
                  setSelectedFilePath(null);
                }
                if (item.name === 'Logs') {
                  setSelectedLog('model_health_log');
                  if (!modelHealthLog) fetchData('/api/logs?logType=model', setModelHealthLog, 'logs');
                }
                if (item.name === 'Help') setSelectedHelpId('Links');
                if (item.name === 'Git') setSelectedGitFile(null);
                if (item.name === 'Models') {
                  fetchData('/api/models', setModelsData, 'models');
                  setSelectedModel(null);
                }
                if (item.name === 'Memory') {
                  if (memoryTree.length > 0) {
                    const firstFile = memoryTree[0].type === 'file' ? memoryTree[0] : memoryTree[0].children?.[0];
                    if (firstFile) setSelectedFilePath(firstFile.path);
                  } else {
                    setSelectedFilePath('MEMORY.md');
                  }
                }
                if (item.name === 'Docs') setSelectedFilePath('__TODO__/TODO.md');
                if (item.name === 'Jobs' && (jobs?.length || 0) > 0) setSelectedJobId(jobs[0].id);
                if (item.name === 'Sessions') {
                  const mainSession = sessions?.find(s => s.key === 'agent:main:main' || s.key?.endsWith(':main'));
                  if (mainSession) setSelectedSessionId(mainSession.sessionId);
                  else if ((sessions?.length || 0) > 0) setSelectedSessionId(sessions[0].sessionId);
                }
                if (item.name === 'History') {
                  if ((history?.length || 0) > 0) setSelectedSessionId(history[0].fileId);
                }
                if (item.name === 'Calendar' && (events?.length || 0) > 0) setSelectedEventId(events[0].id);
                if (item.name === 'Scripts') {
                  setSelectedFilePath('scripts/system_health_stats.py');
                }
                if (item.name === 'Tasks' && (tasks?.length || 0) > 0) setSelectedTaskId(tasks[0].id);
                if (item.name === 'System' && (systemTree?.length || 0) > 0) {
                  setSelectedFilePath('openclaw.json');
                }
                if (item.name === 'Skills') {
                  const birdSkill = skills.workspace?.find(s => s.name === 'bird') || skills.workspace?.[0] || skills.system?.[0];
                  if (birdSkill) {
                    setSelectedSkillId(birdSkill.id);
                    setSelectedSkillFile(birdSkill.hasReadme ? 'SKILL.md' : (birdSkill.files[0]?.name || ''));
                  }
                }
              }}
              className={cn(
                "w-full flex items-center gap-0 md:gap-2.5 px-2 md:px-3 py-1.5 rounded-md text-[13px] font-medium transition-all group justify-center md:justify-start",
                activeTab === item.name ? "bg-[#1F1F1F] text-[#FFFFFF]" : "text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#161616]"
              )}
            >
              <item.icon size={16} className={cn("transition-colors shrink-0", activeTab === item.name ? "text-[#5E6AD2]" : "text-[#8A8A8A] group-hover:text-[#EDEDED]")} />
              <span className="hidden md:block truncate">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Status & Version Footer */}
        <div className="hidden md:block">
          <SystemStatus
            gatewayStatus={gatewayStatus}
            sessions={sessions}
            jobs={jobs}
            gitStatus={gitStatus}
            modelStatus={modelStatus}
            updating={updating}
            setUpdating={setUpdating}
            isMounted={isMounted}
            onNavigateToHeartbeat={() => {
              setActiveTab('Docs');
              setSelectedFilePath('HEARTBEAT.md');
            }}
            onNavigateToSessions={() => {
              setActiveTab('Sessions');
            }}
            onNavigateToJobs={() => {
              setActiveTab('Jobs');
            }}
            onNavigateToModel={() => {
              setActiveTab('Models');
            }}
            onNavigateToGit={() => {
              setActiveTab('Git');
            }}
          />
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row p-2 md:p-4 gap-4">
          {/* Middle Column */}
          <div className={cn(
            "w-full sm:w-[260px] md:w-[280px] lg:w-[320px] flex flex-col gap-3",
            hasSelection ? "hidden sm:flex" : "flex"
          )}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555555]" size={14} />
              <input
                type="text"
                placeholder={`Filter ${activeTab.toLowerCase()}...`}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-[#111111] border border-[#1F1F1F] rounded-md px-8 py-1.5 text-[12px] w-full focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {renderLeft()}
            </div>
          </div>

          {/* Right Column */}
          <div className={cn(
            "flex-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl flex flex-col shadow-2xl overflow-hidden",
            !hasSelection ? "hidden sm:flex" : "flex"
          )}>
            {hasSelection && (
              <div className="flex items-center p-2 border-b border-[#1F1F1F] sm:hidden bg-[#0A0A0A]/50 backdrop-blur-md">
                <button
                  onClick={clearSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#161616] transition-all"
                >
                  <ChevronLeft size={16} />
                  <span>Back to list</span>
                </button>
              </div>
            )}
            {renderRight()}
          </div>
        </div>
      </main>
    </div>
  );
}
