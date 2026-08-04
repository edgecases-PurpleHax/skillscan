import { describe, it, expect } from 'vitest';
import { scan } from '../../src/core/scanner.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, '..', 'fixtures', 'skills');

const baseConfig = {
  paths: [],
  qualityGate: { failOn: 'critical' as const },
  rules: {},
  output: { formats: [] as never[] },
};

describe('malicious-skill.md', () => {
  it('produces findings', async () => {
    const result = await scan({ ...baseConfig, paths: [join(FIXTURES, 'malicious-skill.md')] }, process.cwd());
    expect(result.totalFindings).toBeGreaterThan(0);
  });

  it('fails the quality gate', async () => {
    const result = await scan({ ...baseConfig, paths: [join(FIXTURES, 'malicious-skill.md')] }, process.cwd());
    expect(result.passed).toBe(false);
  });

  it('has blocker-level findings', async () => {
    const result = await scan({ ...baseConfig, paths: [join(FIXTURES, 'malicious-skill.md')] }, process.cwd());
    expect(result.bySeverity.blocker).toBeGreaterThan(0);
  });
});

describe('subtle-skill.md (static only)', () => {
  it('produces zero static findings', async () => {
    const result = await scan({ ...baseConfig, paths: [join(FIXTURES, 'subtle-skill.md')] }, process.cwd());
    expect(result.totalFindings).toBe(0);
  });

  it('passes the quality gate without LLM', async () => {
    const result = await scan({ ...baseConfig, paths: [join(FIXTURES, 'subtle-skill.md')] }, process.cwd());
    expect(result.passed).toBe(true);
  });
});

describe('scanner file resolution', () => {
  it('resolves a direct file path', async () => {
    const result = await scan({ ...baseConfig, paths: [join(FIXTURES, 'malicious-skill.md')] }, process.cwd());
    expect(result.files).toHaveLength(1);
    expect(result.files[0].filePath).toContain('malicious-skill.md');
  });

  it('resolves all md files in a directory', async () => {
    const result = await scan({ ...baseConfig, paths: [FIXTURES] }, process.cwd());
    expect(result.files.length).toBeGreaterThanOrEqual(3);
  });
});
