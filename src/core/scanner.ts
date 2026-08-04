import { readFileSync } from 'fs';
import { glob } from 'glob';
import type { ScanConfig, ScanResult, FileScanResult, SkillContent, Severity } from '../types.js';
import { buildRuleSet } from '../rules/registry.js';
import { runLLMAnalysis } from '../rules/llm/enrichment.js';
import { evaluateQualityGate } from './quality-gate.js';
import { SEVERITY_ORDER } from '../types.js';

const SKILL_EXTENSIONS = ['**/*.md', '**/*.txt', '**/*.yml', '**/*.yaml'];

async function resolveFiles(paths: string[], cwd: string): Promise<string[]> {
  const found = new Set<string>();
  for (const scanPath of paths) {
    const patterns = SKILL_EXTENSIONS.map((ext) => `${scanPath}/${ext}`);
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd, absolute: true, ignore: ['**/node_modules/**'] });
      for (const m of matches) found.add(m);
    }
  }
  return [...found].sort();
}

function loadSkill(filePath: string): SkillContent {
  const raw = readFileSync(filePath, 'utf-8');
  return { filePath, raw, lines: raw.split('\n') };
}

export async function scan(config: ScanConfig, cwd: string): Promise<ScanResult> {
  const start = Date.now();
  const hasLLM = !!config.llm;
  const rules = buildRuleSet(config, false);

  const files = await resolveFiles(config.paths, cwd);
  const fileResults: FileScanResult[] = [];

  for (const filePath of files) {
    const content = loadSkill(filePath);
    const findings = rules.flatMap((rule) => {
      try {
        return rule.check(content);
      } catch {
        return [];
      }
    });

    if (hasLLM && config.llm) {
      const llmFindings = await runLLMAnalysis(content, config.llm);
      findings.push(...llmFindings);
    }

    findings.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
    fileResults.push({ filePath, findings });
  }

  const allFindings = fileResults.flatMap((r) => r.findings);
  const bySeverity = {
    info: 0, minor: 0, major: 0, critical: 0, blocker: 0,
  } as Record<Severity, number>;
  for (const f of allFindings) bySeverity[f.severity]++;

  const totalFindings = allFindings.length;
  const { passed, message } = evaluateQualityGate(bySeverity, config.qualityGate);

  return {
    files: fileResults,
    totalFindings,
    bySeverity,
    passed,
    qualityGateMessage: message,
    durationMs: Date.now() - start,
  };
}
