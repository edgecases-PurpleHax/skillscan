import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import type { ScanConfig } from '../types.js';

const SeveritySchema = z.enum(['info', 'minor', 'major', 'critical', 'blocker']);

const ConfigSchema = z.object({
  scan: z.object({
    paths: z.array(z.string()).default(['.claude/skills', 'skills', '.claude']),
  }).default({}),
  quality_gate: z.object({
    fail_on: SeveritySchema.default('critical'),
    max_minor: z.number().optional(),
    max_major: z.number().optional(),
    max_critical: z.number().optional(),
  }).default({}),
  rules: z.record(z.object({
    severity: SeveritySchema.optional(),
    enabled: z.boolean().optional(),
  })).default({}),
  llm: z.object({
    provider: z.enum(['claude', 'openai']),
    model: z.string().optional(),
    api_key: z.string().optional(),
  }).optional(),
  tracking: z.object({
    enabled: z.boolean().default(false),
  }).default({}),
  reputation: z.object({
    enabled: z.boolean().default(false),
    api_key: z.string().optional(),
  }).default({}),
  output: z.object({
    formats: z.array(z.enum(['terminal', 'json', 'sarif', 'html'])).default(['terminal']),
    output_dir: z.string().optional(),
  }).default({}),
});

export function loadConfig(cwd: string, configPath?: string): ScanConfig {
  const candidates = configPath
    ? [configPath]
    : [
        join(cwd, 'skillscan.yml'),
        join(cwd, 'skillscan.yaml'),
        join(cwd, '.skillscan.yml'),
      ];

  let raw: unknown = {};
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      raw = yaml.load(readFileSync(candidate, 'utf-8')) ?? {};
      break;
    }
  }

  const parsed = ConfigSchema.parse(raw);

  return {
    paths: parsed.scan.paths,
    qualityGate: {
      failOn: parsed.quality_gate.fail_on,
      maxMinor: parsed.quality_gate.max_minor,
      maxMajor: parsed.quality_gate.max_major,
      maxCritical: parsed.quality_gate.max_critical,
    },
    rules: parsed.rules,
    llm: parsed.llm
      ? {
          provider: parsed.llm.provider,
          model: parsed.llm.model,
          apiKey: parsed.llm.api_key ?? process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY,
        }
      : undefined,
    output: {
      formats: parsed.output.formats,
      outputDir: parsed.output.output_dir,
    },
    track: parsed.tracking.enabled,
    reputation: parsed.reputation.enabled
      ? {
          enabled: true,
          apiKey: parsed.reputation.api_key ?? process.env.SKILLSMP_API_KEY,
        }
      : undefined,
  };
}
