import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scan } from '../../src/core/scanner.js';
import type { ScanConfig } from '../../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = resolve(__dirname, '..', 'corpus');

interface CorpusEntry {
  file: string;
  label: 'malicious' | 'benign';
  difficulty: 'obvious' | 'moderate' | 'subtle' | null;
  expectedRules: string[];
  llmOnly: boolean;
  description: string;
}

const manifest: { entries: CorpusEntry[] } = JSON.parse(
  readFileSync(join(CORPUS_DIR, 'corpus.json'), 'utf-8'),
);

const BASE_CONFIG: ScanConfig = {
  paths: [],
  qualityGate: { failOn: 'blocker' },
  rules: {},
  output: { formats: [] },
};

async function scanFile(file: string) {
  const filePath = join(CORPUS_DIR, file);
  return scan({ ...BASE_CONFIG, paths: [filePath] }, process.cwd());
}

const obviousEntries = manifest.entries.filter(
  (e) => e.label === 'malicious' && e.difficulty === 'obvious' && !e.llmOnly,
);

const moderateEntries = manifest.entries.filter(
  (e) => e.label === 'malicious' && e.difficulty === 'moderate' && !e.llmOnly,
);

const benignEntries = manifest.entries.filter((e) => e.label === 'benign');

describe('Corpus -- obvious malicious files (static recall must be 100%)', () => {
  for (const entry of obviousEntries) {
    it(`detects ${entry.file}`, async () => {
      const result = await scanFile(entry.file);
      const actualRules = result.files.flatMap((f) => f.findings.map((fn) => fn.ruleId));
      const detected = entry.expectedRules.some((r) => actualRules.includes(r));
      expect(detected, `Expected one of [${entry.expectedRules.join(', ')}] to fire. Got: [${actualRules.join(', ')}]\n${entry.description}`).toBe(true);
    });
  }
});

describe('Corpus -- moderate malicious files', () => {
  for (const entry of moderateEntries) {
    it(`detects ${entry.file}`, async () => {
      const result = await scanFile(entry.file);
      const actualRules = result.files.flatMap((f) => f.findings.map((fn) => fn.ruleId));
      const detected = entry.expectedRules.some((r) => actualRules.includes(r));
      expect(detected, `Expected one of [${entry.expectedRules.join(', ')}] to fire. Got: [${actualRules.join(', ')}]\n${entry.description}`).toBe(true);
    });
  }
});

describe('Corpus -- benign files (zero false positives)', () => {
  for (const entry of benignEntries) {
    it(`produces no findings for ${entry.file}`, async () => {
      const result = await scanFile(entry.file);
      const actualRules = result.files.flatMap((f) => f.findings.map((fn) => fn.ruleId));
      expect(actualRules, `${entry.file} produced unexpected findings: [${actualRules.join(', ')}]`).toHaveLength(0);
    });
  }
});
