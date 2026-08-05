import type { Severity, QualityGateConfig, Finding } from '../types.js';
import { SEVERITY_ORDER } from '../types.js';

export function filterForGate(findings: Finding[], config: QualityGateConfig): Finding[] {
  const minConfidence = config.minConfidence ?? 50;
  return findings.filter(
    (f) => !f.isHotspot && (f.confidence === undefined || f.confidence >= minConfidence),
  );
}

export function evaluateQualityGate(
  bySeverity: Record<Severity, number>,
  config: QualityGateConfig,
): { passed: boolean; message: string } {
  const failThreshold = SEVERITY_ORDER[config.failOn];

  const breaches: string[] = [];

  for (const [sev, count] of Object.entries(bySeverity) as [Severity, number][]) {
    if (count === 0) continue;
    if (SEVERITY_ORDER[sev] >= failThreshold) {
      breaches.push(`${count} ${sev}`);
    }
  }

  if (config.maxMinor !== undefined && bySeverity.minor > config.maxMinor) {
    breaches.push(`${bySeverity.minor} minor (max ${config.maxMinor})`);
  }
  if (config.maxMajor !== undefined && bySeverity.major > config.maxMajor) {
    breaches.push(`${bySeverity.major} major (max ${config.maxMajor})`);
  }
  if (config.maxCritical !== undefined && bySeverity.critical > config.maxCritical) {
    breaches.push(`${bySeverity.critical} critical (max ${config.maxCritical})`);
  }

  if (breaches.length === 0) {
    return { passed: true, message: 'Quality gate passed.' };
  }

  return {
    passed: false,
    message: `Quality gate FAILED: ${breaches.join(', ')}.`,
  };
}
