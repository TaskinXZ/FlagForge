import React, { useState, useEffect } from 'react';
import {
  FeatureFlag,
  AuditLog,
  Environment,
  FlagType,
  UserContext,
  getStoredFlags,
  saveFlags,
  getStoredAuditLogs,
  saveAuditLogs,
  fnv1a,
  evaluateFlag,
} from './services/flagStore';
import {
  Flag,
  Zap,
  Sliders,
  History,
  Code,
  Plus,
  RotateCcw,
  Check,
  Copy,
  Users,
  ShieldAlert,
  Server,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const SAMPLE_USERS: UserContext[] = [
  { id: 'usr_101', email: 'alex@kickoff.dev', role: 'admin', tier: 'enterprise', country: 'US' },
  { id: 'usr_102', email: 'sara@company.com', role: 'member', tier: 'pro', country: 'GB' },
  { id: 'usr_103', email: 'jordan@gmail.com', role: 'guest', tier: 'free', country: 'CA' },
  { id: 'usr_104', email: 'taylor@outlook.com', role: 'guest', tier: 'free', country: 'DE' },
  { id: 'usr_105', email: 'marcus@startup.io', role: 'member', tier: 'pro', country: 'FR' },
  { id: 'usr_106', email: 'elena@gmail.com', role: 'guest', tier: 'free', country: 'ES' },
  { id: 'usr_107', email: 'kenji@kickoff.dev', role: 'admin', tier: 'enterprise', country: 'JP' },
  { id: 'usr_108', email: 'chloe@yahoo.com', role: 'guest', tier: 'free', country: 'AU' },
];

export default function App() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [currentEnv, setCurrentEnv] = useState<Environment>('production');
  const [activeTab, setActiveTab] = useState<'flags' | 'simulation' | 'audit' | 'sdk'>('flags');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New Flag modal
  const [isNewFlagOpen, setIsNewFlagOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<FlagType>('percentage');
  const [newInitialPct, setNewInitialPct] = useState(25);

  // Selected flag for simulation
  const [simFlagId, setSimFlagId] = useState<string>('flg_canary_checkout');

  useEffect(() => {
    setFlags(getStoredFlags());
    setLogs(getStoredAuditLogs());
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Toggle flag in current environment
  const handleToggleFlag = (flagId: string) => {
    const updated = flags.map((f) => {
      if (f.id === flagId) {
        const currentlyEnabled = f.environments[currentEnv].enabled;
        const newEnabled = !currentlyEnabled;

        const newLog: AuditLog = {
          id: `aud_${Date.now()}`,
          flagKey: f.key,
          action: 'toggle',
          author: 'Zahin Arman Siyam',
          timestamp: new Date().toISOString(),
          summary: `Toggled ${f.name} in ${currentEnv} to ${newEnabled ? 'ENABLED' : 'DISABLED'}`,
          previousValue: currentlyEnabled ? 'enabled' : 'disabled',
          newValue: newEnabled ? 'enabled' : 'disabled',
        };

        const newLogs = [newLog, ...logs];
        setLogs(newLogs);
        saveAuditLogs(newLogs);

        return {
          ...f,
          environments: {
            ...f.environments,
            [currentEnv]: {
              ...f.environments[currentEnv],
              enabled: newEnabled,
            },
          },
        };
      }
      return f;
    });

    setFlags(updated);
    saveFlags(updated);
  };

  // Update rollout percentage
  const handlePercentageChange = (flagId: string, pct: number) => {
    const updated = flags.map((f) => {
      if (f.id === flagId) {
        const prevPct = f.environments[currentEnv].percentage;
        return {
          ...f,
          environments: {
            ...f.environments,
            [currentEnv]: {
              ...f.environments[currentEnv],
              percentage: pct,
            },
          },
        };
      }
      return f;
    });

    setFlags(updated);
    saveFlags(updated);
  };

  // Log percentage update on mouse up
  const handlePercentageCommit = (flagId: string, pct: number) => {
    const target = flags.find((f) => f.id === flagId);
    if (!target) return;

    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      flagKey: target.key,
      action: 'percentage_update',
      author: 'Zahin Arman Siyam',
      timestamp: new Date().toISOString(),
      summary: `Updated canary rollout in ${currentEnv} to ${pct}%`,
      previousValue: `${target.environments[currentEnv].percentage}%`,
      newValue: `${pct}%`,
    };

    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    saveAuditLogs(newLogs);
  };

  // Create flag
  const handleCreateFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newName.trim()) return;

    const cleanKey = newKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newFlag: FeatureFlag = {
      id: `flg_${Date.now()}`,
      key: cleanKey,
      name: newName,
      description: newDesc,
      type: newType,
      enabled: true,
      percentage: newInitialPct,
      rules: [],
      environments: {
        development: { enabled: true, percentage: 100 },
        staging: { enabled: true, percentage: 50 },
        production: { enabled: false, percentage: newInitialPct },
      },
      tags: ['new-release'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedFlags = [newFlag, ...flags];
    setFlags(updatedFlags);
    saveFlags(updatedFlags);

    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      flagKey: cleanKey,
      action: 'create',
      author: 'Zahin Arman Siyam',
      timestamp: new Date().toISOString(),
      summary: `Created feature flag ${cleanKey}`,
      previousValue: 'none',
      newValue: 'created',
    };
    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    saveAuditLogs(newLogs);

    setIsNewFlagOpen(false);
    setNewKey('');
    setNewName('');
    setNewDesc('');
  };

  // Rollback action
  const handleRollback = (log: AuditLog) => {
    const targetFlag = flags.find((f) => f.key === log.flagKey);
    if (!targetFlag) return;

    const isPct = log.previousValue.includes('%');
    const updated = flags.map((f) => {
      if (f.key === log.flagKey) {
        if (isPct) {
          const pct = parseInt(log.previousValue);
          return {
            ...f,
            environments: {
              ...f.environments,
              [currentEnv]: { ...f.environments[currentEnv], percentage: isNaN(pct) ? 0 : pct },
            },
          };
        } else {
          const enabled = log.previousValue === 'enabled';
          return {
            ...f,
            environments: {
              ...f.environments,
              [currentEnv]: { ...f.environments[currentEnv], enabled },
            },
          };
        }
      }
      return f;
    });

    setFlags(updated);
    saveFlags(updated);

    const rollbackLog: AuditLog = {
      id: `aud_${Date.now()}`,
      flagKey: log.flagKey,
      action: 'rollback',
      author: 'Zahin Arman Siyam',
      timestamp: new Date().toISOString(),
      summary: `Rolled back to previous state (${log.previousValue})`,
      previousValue: log.newValue,
      newValue: log.previousValue,
    };
    const newLogs = [rollbackLog, ...logs];
    setLogs(newLogs);
    saveAuditLogs(newLogs);
  };

  const simFlag = flags.find((f) => f.id === simFlagId) || flags[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-stone-800 bg-stone-900/60 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flag className="w-5 h-5 text-stone-950 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-stone-200 to-orange-400 bg-clip-text text-transparent">
                FlagForge
              </span>
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                0ms-EDGE
              </span>
            </div>
          </div>

          {/* Environment Switcher */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            {(['development', 'staging', 'production'] as Environment[]).map((env) => (
              <button
                key={env}
                onClick={() => setCurrentEnv(env)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition flex items-center gap-1.5 ${
                  currentEnv === env
                    ? env === 'production'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : env === 'staging'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    env === 'production' ? 'bg-rose-400' : env === 'staging' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                {env}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs & Action Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('flags')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'flags' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Flags ({flags.length})
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'simulation' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Canary Simulator
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Log ({logs.length})
            </button>

            <button
              onClick={() => setActiveTab('sdk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'sdk' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Client SDK
            </button>
          </div>

          <button
            onClick={() => setIsNewFlagOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Flag
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {activeTab === 'flags' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="capitalize">{currentEnv}</span> Feature Flags
                </h1>
                <p className="text-xs text-stone-400 mt-1 font-mono">
                  Targeting rules and percentage rollouts are cached on edge and evaluated in 0.001ms.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-stone-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Real-Time SSE Sync: Active
              </div>
            </div>

            {/* Flag Cards */}
            <div className="space-y-4">
              {flags.map((flag) => {
                const envConf = flag.environments[currentEnv];
                return (
                  <div
                    key={flag.id}
                    className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-md space-y-5 hover:border-stone-700 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-base bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                            {flag.key}
                          </span>
                          <span className="text-sm font-semibold text-stone-300">{flag.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                            {flag.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 max-w-2xl">{flag.description}</p>
                      </div>

                      {/* Main Switch Button */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-stone-400">
                          {envConf.enabled ? 'ON' : 'OFF'}
                        </span>
                        <button
                          onClick={() => handleToggleFlag(flag.id)}
                          className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                            envConf.enabled ? 'bg-orange-500' : 'bg-stone-800'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                              envConf.enabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Percentage Slider (for canary flags) */}
                    {flag.type === 'percentage' && (
                      <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-400 flex items-center gap-2">
                            <Sliders className="w-3.5 h-3.5 text-orange-400" />
                            Canary Rollout Percentage ({currentEnv})
                          </span>
                          <span className="text-orange-400 font-bold text-sm">{envConf.percentage}%</span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={envConf.percentage}
                          disabled={!envConf.enabled}
                          onChange={(e) => handlePercentageChange(flag.id, Number(e.target.value))}
                          onMouseUp={(e) => handlePercentageCommit(flag.id, Number((e.target as HTMLInputElement).value))}
                          className="w-full accent-orange-500 cursor-pointer disabled:opacity-30"
                        />

                        {/* Audience Bar Visualizer */}
                        <div className="h-2 rounded-full bg-stone-800 overflow-hidden flex">
                          <div
                            style={{ width: `${envConf.enabled ? envConf.percentage : 0}%` }}
                            className="bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                          />
                        </div>
                      </div>
                    )}

                    {/* Targeting Rules */}
                    {flag.rules.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-stone-400">
                        <span className="text-stone-500">Targeting Rules:</span>
                        {flag.rules.map((rule) => (
                          <span
                            key={rule.id}
                            className="bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800 text-stone-300"
                          >
                            {rule.attribute} {rule.operator} [{rule.values.join(', ')}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'simulation' ? (
          /* Canary Simulation Lab */
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    Canary Deterministic Hash Simulator
                  </h2>
                  <p className="text-xs text-stone-400 mt-1">
                    See how deterministic hashing (FNV-1a) assigns features consistently to users without any database lookup.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-400">Testing Flag:</span>
                  <select
                    value={simFlagId}
                    onChange={(e) => setSimFlagId(e.target.value)}
                    className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  >
                    {flags.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.key} ({f.environments[currentEnv].percentage}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample User Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {SAMPLE_USERS.map((user) => {
                  const evalResult = evaluateFlag(simFlag, currentEnv, user);
                  const hashVal = fnv1a(`${simFlag.key}:${user.id}`);

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                        evalResult.enabled
                          ? 'bg-orange-950/20 border-orange-500/40 text-orange-200'
                          : 'bg-stone-950 border-stone-800 text-stone-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-stone-300">{user.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                              evalResult.enabled
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {evalResult.enabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {evalResult.enabled ? 'New Feature' : 'Legacy'}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-stone-200 font-semibold truncate">{user.email}</div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-2">
                          <span className="capitalize">{user.tier} tier</span>
                          <span>•</span>
                          <span>{user.country}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-800/80 font-mono text-[10px] flex items-center justify-between text-stone-500">
                        <span>Hash bucket: {hashVal}%</span>
                        <span className="truncate max-w-[120px]">{evalResult.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'audit' ? (
          /* Audit Logs Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-400" />
                  Configuration Audit Log & Rollback
                </h2>
                <p className="text-xs text-stone-400 mt-1 font-mono">
                  Full immutable history of all flag changes with 1-click safety rollback.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-orange-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                        {log.flagKey}
                      </span>
                      <span className="text-stone-300 font-sans font-medium">{log.summary}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-3">
                      <span>By {log.author}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-stone-400">
                        {log.previousValue} → {log.newValue}
                      </span>
                    </div>
                  </div>

                  {log.previousValue !== 'none' && log.previousValue !== 'created' && (
                    <button
                      onClick={() => handleRollback(log)}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                      Rollback
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* SDK & Code Generator Tab */
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Zero-Latency Client SDK</h2>
              <p className="text-xs text-stone-400 mt-1 font-mono">
                Integrate feature evaluation in React, Node, or Next.js with sub-millisecond execution.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-orange-400 font-mono">React Hook Usage (`useFlag`)</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `import { useFlag } from '@flagforge/react';\n\nfunction CheckoutView() {\n  const isCanary = useFlag('new_streamlined_checkout', { userId: 'usr_102' });\n  return isCanary ? <NewCheckout /> : <OldCheckout />;\n}`,
                      'react_code',
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 border border-stone-700 flex items-center gap-1.5 transition"
                >
                  {copiedText === 'react_code' ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy React Snippet
                </button>
              </div>

              <pre className="p-4 bg-stone-950 rounded-2xl font-mono text-xs text-orange-300 border border-stone-800 overflow-x-auto leading-relaxed">
{`import { useFlag } from '@flagforge/react';

export function CheckoutView({ user }) {
  // Evaluates instantly from memory cache with 0ms latency
  const showNewCheckout = useFlag('new_streamlined_checkout', {
    id: user.id,
    email: user.email,
    tier: user.tier
  });

  return (
    <div>
      {showNewCheckout ? (
        <OneClickCheckoutExpress />
      ) : (
        <StandardCheckoutForm />
      )}
    </div>
  );
}`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* New Flag Modal */}
      {isNewFlagOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-400" />
                Create Feature Flag
              </h3>
              <button onClick={() => setIsNewFlagOpen(false)} className="text-stone-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFlag} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-stone-400 mb-1.5">Flag Key (snake_case)</label>
                <input
                  type="text"
                  placeholder="e.g. beta_search_v2"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-400 mb-1.5">Friendly Name</label>
                <input
                  type="text"
                  placeholder="e.g. Algolia Search V2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-400 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="What does this feature flag control?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1.5">Flag Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FlagType)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  >
                    <option value="percentage">Percentage (Canary)</option>
                    <option value="boolean">Boolean (On/Off)</option>
                  </select>
                </div>

                {newType === 'percentage' && (
                  <div>
                    <label className="block text-xs font-mono text-stone-400 mb-1.5">Initial Rollout %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newInitialPct}
                      onChange={(e) => setNewInitialPct(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFlagOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-stone-950 font-bold text-xs"
                >
                  Create Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
