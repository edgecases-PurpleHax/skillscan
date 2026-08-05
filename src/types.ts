export type Severity = 'info' | 'minor' | 'major' | 'critical' | 'blocker';

export type ReviewDecision = 'accepted' | 'false-positive' | 'wont-fix';

export interface Review {
  id: number;
  findingId: number;
  decision: ReviewDecision;
  reviewer: string;
  timestamp: string;
  note?: string;
}

export type Category =
  | 'injection'
  | 'exfiltration'
  | 'tool-abuse'
  | 'social-engineering'
  | 'obfuscation'
  | 'permission-escalation';

export interface Finding {
  id?: number;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  category: Category;
  message: string;
  line?: number;
  snippet?: string;
  remediation: string;
  confidence?: number;   // 0-100, LLM findings only; undefined = static rule (implicitly high confidence)
  isHotspot?: boolean;   // true = needs human review, not a definitive vulnerability
}

export interface DbFinding extends Finding {
  id: number;
  filePath: string;
  snippetHash: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: Category;
  requiresLLM: boolean;
  check: (content: SkillContent) => Finding[];
}

export interface SkillContent {
  filePath: string;
  raw: string;
  lines: string[];
}

export interface FileScanResult {
  filePath: string;
  findings: Finding[];
}

export interface ScanResult {
  files: FileScanResult[];
  totalFindings: number;
  bySeverity: Record<Severity, number>;
  passed: boolean;
  qualityGateMessage: string;
  durationMs: number;
  trackingAlerts?: TrackingAlert[];
  trackingBaseline?: boolean;
  unreviewedFindings?: number;
  reviewCoverage?: number;
}

export interface QualityGateConfig {
  failOn: Severity;
  maxMinor?: number;
  maxMajor?: number;
  maxCritical?: number;
  minConfidence?: number;  // LLM findings below this confidence are excluded from gate (default: 50)
}

export interface LLMConfig {
  provider: 'claude' | 'openai';
  model?: string;
  apiKey?: string;
}

export interface ReputationConfig {
  enabled: boolean;
  apiKey?: string;
}

export interface ScanConfig {
  paths: string[];
  qualityGate: QualityGateConfig;
  rules: Record<string, { severity?: Severity; enabled?: boolean }>;
  llm?: LLMConfig;
  output: {
    formats: Array<'terminal' | 'json' | 'sarif' | 'html'>;
    outputDir?: string;
  };
  track?: boolean;
  reputation?: ReputationConfig;
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  minor: 1,
  major: 2,
  critical: 3,
  blocker: 4,
};

export interface TrackingAlert {
  filePath: string;
  type: 'regression' | 'file-changed' | 'confidence-spike' | 'new-findings';
  message: string;
}
