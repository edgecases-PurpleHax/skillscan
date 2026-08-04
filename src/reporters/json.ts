import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ScanResult } from '../types.js';

export function renderJSON(result: ScanResult, outputDir: string): string {
  mkdirSync(outputDir, { recursive: true });
  const outPath = join(outputDir, 'skillscan-report.json');
  const payload = {
    version: '1',
    timestamp: new Date().toISOString(),
    summary: {
      filesScanned: result.files.length,
      totalFindings: result.totalFindings,
      bySeverity: result.bySeverity,
      passed: result.passed,
      qualityGateMessage: result.qualityGateMessage,
      durationMs: result.durationMs,
    },
    files: result.files,
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}
