import { readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scan } from './core/scanner.js';
import type { ScanConfig } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = resolve(__dirname, '..', 'test', 'corpus');

interface CorpusEntry {
  file: string;
  label: 'malicious' | 'benign';
  difficulty: 'obvious' | 'moderate' | 'subtle' | null;
  categories: string[];
  expectedRules: string[];
  llmOnly: boolean;
  description: string;
}

interface CorpusManifest {
  version: string;
  entries: CorpusEntry[];
}

const BASE_CONFIG: ScanConfig = {
  paths: [],
  qualityGate: { failOn: 'blocker' },
  rules: {},
  output: { formats: [] },
};

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function pct(n: number, d: number): string {
  if (d === 0) return '  n/a';
  return `${((n / d) * 100).toFixed(1).padStart(5)}%`;
}

async function main() {
  const manifest: CorpusManifest = JSON.parse(
    readFileSync(join(CORPUS_DIR, 'corpus.json'), 'utf-8'),
  );

  console.log(`\n${BOLD}SkillScan Corpus Benchmark${RESET}`);
  console.log('Static rules only -- 21 rules, no LLM');
  console.log('='.repeat(60));

  type Result = {
    entry: CorpusEntry;
    detected: boolean;
    actualRules: string[];
    skipped: boolean;
  };

  const results: Result[] = [];

  for (const entry of manifest.entries) {
    const filePath = join(CORPUS_DIR, entry.file);

    if (entry.llmOnly) {
      results.push({ entry, detected: false, actualRules: [], skipped: true });
      continue;
    }

    const result = await scan({ ...BASE_CONFIG, paths: [filePath] }, process.cwd());
    const actualRules = [...new Set(result.files.flatMap((f) => f.findings.map((fn) => fn.ruleId)))];

    let detected: boolean;
    if (entry.label === 'benign') {
      detected = actualRules.length === 0;
    } else {
      if (entry.expectedRules.length === 0) {
        detected = actualRules.length > 0;
      } else {
        detected = entry.expectedRules.some((r) => actualRules.includes(r));
      }
    }

    results.push({ entry, detected, actualRules, skipped: false });
  }

  console.log(`\n${BOLD}RESULTS${RESET}`);
  console.log('-'.repeat(60));

  for (const r of results) {
    const label = pad(r.entry.file, 52);
    if (r.skipped) {
      console.log(`${DIM}${label}  LLM-ONLY${RESET}`);
      continue;
    }
    if (r.entry.label === 'benign') {
      const status = r.detected ? `${GREEN}CLEAN${RESET}` : `${RED}FALSE POSITIVE${RESET} (${r.actualRules.join(', ')})`;
      console.log(`${label}  ${status}`);
    } else {
      const status = r.detected
        ? `${GREEN}DETECTED${RESET}   (${r.actualRules.join(', ')})`
        : `${RED}MISSED${RESET}`;
      console.log(`${label}  ${status}`);
    }
  }

  const designedMalicious = results.filter(
    (r) => r.entry.label === 'malicious' && !r.skipped && r.entry.difficulty !== 'real-world',
  );
  const realWorldMalicious = results.filter(
    (r) => r.entry.label === 'malicious' && !r.skipped && r.entry.difficulty === 'real-world',
  );
  const benign = results.filter((r) => r.entry.label === 'benign');
  const llmOnly = results.filter((r) => r.skipped);

  console.log(`\n${BOLD}SUMMARY${RESET}`);
  console.log('-'.repeat(60));
  console.log('\nDesigned corpus recall by difficulty:');
  console.log(`  ${'Difficulty'.padEnd(12)}  ${'Detected'.padEnd(10)}  ${'Recall'.padEnd(8)}`);

  for (const diff of ['obvious', 'moderate'] as const) {
    const group = designedMalicious.filter((r) => r.entry.difficulty === diff);
    const detected = group.filter((r) => r.detected).length;
    console.log(`  ${diff.padEnd(12)}  ${`${detected}/${group.length}`.padEnd(10)}  ${pct(detected, group.length)}`);
  }

  if (llmOnly.length > 0) {
    console.log(`  ${'subtle'.padEnd(12)}  ${'0/' + llmOnly.length.toString().padEnd(8)}  ${DIM}LLM required${RESET}`);
  }

  if (realWorldMalicious.length > 0) {
    const rwDetected = realWorldMalicious.filter((r) => r.detected).length;
    console.log(`\nReal-world corpus (${realWorldMalicious.length} files, labeled by sumleo/AgentSkillsScanner):`);
    console.log(`  ${'real-world'.padEnd(12)}  ${`${rwDetected}/${realWorldMalicious.length}`.padEnd(10)}  ${pct(rwDetected, realWorldMalicious.length)}  ${DIM}(LLM enrichment needed for remainder)${RESET}`);
  }

  const designedDetected = designedMalicious.filter((r) => r.detected).length;
  const benignClean = benign.filter((r) => r.detected).length;
  const benignFP = benign.length - benignClean;

  console.log('\nBenign false positive rate:');
  console.log(
    `  ${benignClean}/${benign.length} clean  --  ${benignFP} false positive${benignFP === 1 ? '' : 's'}  (${pct(benignFP, benign.length)} FP rate)`,
  );

  console.log('\nOverall static performance:');
  console.log(`  Recall (designed obvious + moderate):  ${pct(designedDetected, designedMalicious.length)}`);
  if (realWorldMalicious.length > 0) {
    const rwDetected = realWorldMalicious.filter((r) => r.detected).length;
    console.log(`  Recall (real-world):                   ${pct(rwDetected, realWorldMalicious.length)}`);
  }
  console.log(`  False positive rate:                   ${pct(benignFP, benign.length)}`);
  console.log(`  LLM-only attacks in corpus:            ${llmOnly.length}`);
  console.log();

  const allPass = designedDetected === designedMalicious.length && benignFP === 0;
  if (!allPass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
