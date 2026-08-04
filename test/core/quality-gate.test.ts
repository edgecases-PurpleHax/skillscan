import { describe, it, expect } from 'vitest';
import { evaluateQualityGate } from '../../src/core/quality-gate.js';
import type { Severity } from '../../src/types.js';

function counts(overrides: Partial<Record<Severity, number>> = {}): Record<Severity, number> {
  return { info: 0, minor: 0, major: 0, critical: 0, blocker: 0, ...overrides };
}

describe('evaluateQualityGate', () => {
  it('passes when no findings', () => {
    const { passed } = evaluateQualityGate(counts(), { failOn: 'critical' });
    expect(passed).toBe(true);
  });

  it('passes when findings are below threshold', () => {
    const { passed } = evaluateQualityGate(counts({ major: 3 }), { failOn: 'critical' });
    expect(passed).toBe(true);
  });

  it('fails when critical finding present and failOn is critical', () => {
    const { passed } = evaluateQualityGate(counts({ critical: 1 }), { failOn: 'critical' });
    expect(passed).toBe(false);
  });

  it('fails when blocker present and failOn is major', () => {
    const { passed } = evaluateQualityGate(counts({ blocker: 1 }), { failOn: 'major' });
    expect(passed).toBe(false);
  });

  it('passes major findings when failOn is critical', () => {
    const { passed } = evaluateQualityGate(counts({ major: 10 }), { failOn: 'critical' });
    expect(passed).toBe(true);
  });

  it('fails when maxMajor exceeded', () => {
    const { passed } = evaluateQualityGate(counts({ major: 6 }), { failOn: 'critical', maxMajor: 5 });
    expect(passed).toBe(false);
  });

  it('passes when major count exactly at maxMajor', () => {
    const { passed } = evaluateQualityGate(counts({ major: 5 }), { failOn: 'critical', maxMajor: 5 });
    expect(passed).toBe(true);
  });

  it('fails when maxMinor exceeded', () => {
    const { passed } = evaluateQualityGate(counts({ minor: 11 }), { failOn: 'critical', maxMinor: 10 });
    expect(passed).toBe(false);
  });

  it('fails when maxCritical exceeded', () => {
    const { passed } = evaluateQualityGate(counts({ critical: 2 }), { failOn: 'blocker', maxCritical: 1 });
    expect(passed).toBe(false);
  });

  it('includes breach details in message', () => {
    const { message } = evaluateQualityGate(counts({ blocker: 2 }), { failOn: 'critical' });
    expect(message).toContain('blocker');
    expect(message).toContain('FAILED');
  });

  it('passes message says passed', () => {
    const { message } = evaluateQualityGate(counts(), { failOn: 'critical' });
    expect(message).toContain('passed');
  });
});
