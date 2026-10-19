// FlagForge Core Feature Flagging & Deterministic Evaluation Service

export type FlagType = 'boolean' | 'percentage' | 'multivariate' | 'json';
export type Environment = 'development' | 'staging' | 'production';

export interface TargetingRule {
  id: string;
  attribute: 'email' | 'role' | 'tier' | 'country';
  operator: 'endsWith' | 'equals' | 'inList';
  values: string[];
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: FlagType;
  enabled: boolean;
  percentage: number; // 0 to 100
  variants?: string[];
  selectedVariant?: string;
  jsonValue?: string;
  rules: TargetingRule[];
  environments: Record<Environment, { enabled: boolean; percentage: number }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  flagKey: string;
  action: 'toggle' | 'percentage_update' | 'rule_change' | 'create' | 'rollback';
  author: string;
  timestamp: string;
  summary: string;
  previousValue: string;
  newValue: string;
}

export interface UserContext {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  tier: 'free' | 'pro' | 'enterprise';
  country: string;
}

// Pure 32-bit FNV-1a deterministic hash function (zero dependencies, 0ms execution)
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0) % 100;
}

// Evaluate whether a user receives a feature flag
export function evaluateFlag(
  flag: FeatureFlag,
  env: Environment,
  user: UserContext,
): { enabled: boolean; reason: string; variant?: string } {
  const envConfig = flag.environments[env];
  if (!envConfig || !envConfig.enabled) {
    return { enabled: false, reason: `Disabled in ${env}` };
  }

  // 1. Check Targeting Rules
  for (const rule of flag.rules) {
    const userAttr = user[rule.attribute];
    if (rule.operator === 'endsWith') {
      if (typeof userAttr === 'string' && rule.values.some((v) => userAttr.endsWith(v))) {
        return { enabled: true, reason: `Matched rule: ${rule.attribute} endsWith ${rule.values.join(', ')}` };
      }
    } else if (rule.operator === 'equals') {
      if (rule.values.includes(userAttr)) {
        return { enabled: true, reason: `Matched rule: ${rule.attribute} equals ${userAttr}` };
      }
    } else if (rule.operator === 'inList') {
      if (rule.values.includes(userAttr)) {
        return { enabled: true, reason: `Matched rule: ${rule.attribute} in list` };
      }
    }
  }

  // 2. Percentage Rollout Evaluation (Deterministic Hashing)
  if (flag.type === 'percentage') {
    const hashValue = fnv1a(`${flag.key}:${user.id}`);
    const isIncluded = hashValue < envConfig.percentage;
    return {
      enabled: isIncluded,
      reason: `Percentage rollout (${hashValue}% bucket vs ${envConfig.percentage}% target)`,
    };
  }

  // Default boolean
  return { enabled: true, reason: 'Enabled globally' };
}

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    id: 'flg_canary_checkout',
    key: 'new_streamlined_checkout',
    name: 'Next-Gen One-Click Checkout',
    description: 'Enables Stripe Elements Express Checkout and Apple Pay sheet in checkout funnel.',
    type: 'percentage',
    enabled: true,
    percentage: 30,
    rules: [
      {
        id: 'rule_1',
        attribute: 'email',
        operator: 'endsWith',
        values: ['@kickoff.dev', '@company.com'],
      },
    ],
    environments: {
      development: { enabled: true, percentage: 100 },
      staging: { enabled: true, percentage: 50 },
      production: { enabled: true, percentage: 30 },
    },
    tags: ['billing', 'growth', 'q4-initiative'],
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-19T14:30:00Z',
  },
  {
    id: 'flg_ai_tactics',
    key: 'ai_tactics_assistant',
    name: 'AI Match Formation Assistant',
    description: 'Autonomous tactical recommendation engine for dynamic half-time adjustments.',
    type: 'boolean',
    enabled: true,
    percentage: 100,
    rules: [
      {
        id: 'rule_2',
        attribute: 'tier',
        operator: 'equals',
        values: ['pro', 'enterprise'],
      },
    ],
    environments: {
      development: { enabled: true, percentage: 100 },
      staging: { enabled: true, percentage: 100 },
      production: { enabled: false, percentage: 0 },
    },
    tags: ['ai', 'beta', 'simulation'],
    createdAt: '2026-10-19T09:00:00Z',
    updatedAt: '2026-10-19T16:00:00Z',
  },
  {
    id: 'flg_dark_theme',
    key: 'stadium_night_mode',
    name: 'OLED Stadium Night Theme',
    description: 'High-contrast midnight dark theme for stadiums and statistics boards.',
    type: 'boolean',
    enabled: true,
    percentage: 100,
    rules: [],
    environments: {
      development: { enabled: true, percentage: 100 },
      staging: { enabled: true, percentage: 100 },
      production: { enabled: true, percentage: 100 },
    },
    tags: ['ui', 'design'],
    createdAt: '2026-10-17T12:00:00Z',
    updatedAt: '2026-10-19T11:20:00Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    flagKey: 'new_streamlined_checkout',
    action: 'percentage_update',
    author: 'Zahin Arman Siyam',
    timestamp: '2026-10-19T14:30:00Z',
    summary: 'Ramped production canary percentage from 10% to 30%',
    previousValue: '10%',
    newValue: '30%',
  },
  {
    id: 'aud_2',
    flagKey: 'ai_tactics_assistant',
    action: 'toggle',
    author: 'Zahin Arman Siyam',
    timestamp: '2026-10-19T16:00:00Z',
    summary: 'Enabled in staging for VIP beta test group',
    previousValue: 'disabled',
    newValue: 'enabled',
  },
];

const STORAGE_KEYS = {
  FLAGS: 'flagforge_flags_v1',
  LOGS: 'flagforge_logs_v1',
};

export const getStoredFlags = (): FeatureFlag[] => {
  const data = localStorage.getItem(STORAGE_KEYS.FLAGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.FLAGS, JSON.stringify(INITIAL_FLAGS));
    return INITIAL_FLAGS;
  }
  return JSON.parse(data);
};

export const saveFlags = (flags: FeatureFlag[]) => {
  localStorage.setItem(STORAGE_KEYS.FLAGS, JSON.stringify(flags));
};

export const getStoredAuditLogs = (): AuditLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  }
  return JSON.parse(data);
};

export const saveAuditLogs = (logs: AuditLog[]) => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
};
