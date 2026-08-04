export type Severity = 'info' | 'minor' | 'major' | 'critical' | 'blocker';

export type Category =
  | 'injection'
  | 'exfiltration'
  | 'tool-abuse'
  | 'social-engineering'
  | 'obfuscation'
  | 'permission-escalation';

export interface Finding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  category: Category;
  message: string;
  line?: number;
  snippet?: string;
  remediation: string;
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
}

export interface QualityGateConfig {
  failOn: Severity;
  maxMinor?: number;
  maxMajor?: number;
  maxCritical?: number;
}

export interface LLMConfig {
  provider: 'claude' | 'openai';
  model?: string;
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
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  minor: 1,
  major: 2,
  critical: 3,
  blocker: 4,
};
