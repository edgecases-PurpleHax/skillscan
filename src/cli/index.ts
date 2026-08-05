#!/usr/bin/env node
import { Command } from 'commander';
import { resolve, join } from 'path';
import { writeFileSync, existsSync } from 'fs';
import { scan } from '../core/scanner.js';
import { loadConfig } from '../config/loader.js';
import { renderTerminal } from '../reporters/terminal.js';
import { renderJSON } from '../reporters/json.js';
import { renderSARIF } from '../reporters/sarif.js';
import { renderHTML } from '../reporters/html.js';
import { ALL_RULES } from '../rules/registry.js';
import { serve } from '../server/index.js';

const VERSION = '0.4.0';
const BANNER = `SkillScan v${VERSION}`;

const program = new Command();

program
  .name('skillscan')
  .description('SonarQube-style security scanner for Claude Code skill files')
  .version(VERSION);

program
  .command('scan [paths...]', { isDefault: true })
  .description('Scan skill files for security issues')
  .option('-c, --config <path>', 'Path to skillscan.yml config file')
  .option('--no-terminal', 'Suppress terminal output')
  .option('--json', 'Write JSON report')
  .option('--sarif', 'Write SARIF report (for GitHub Security tab)')
  .option('--html', 'Write HTML report')
  .option('--output-dir <dir>', 'Directory for report files', '.skillscan')
  .option('--fail-on <severity>', 'Minimum severity that triggers a non-zero exit (info|minor|major|critical|blocker)', 'critical')
  .option('--llm <provider>', 'Enable LLM enrichment (claude|openai)')
  .option('--model <model>', 'LLM model to use')
  .option('--min-confidence <n>', 'Minimum LLM confidence (0-100) to include in quality gate (default: 50)', '50')
  .option('--track', 'Enable skill integrity tracking via .skillscan-lock.json')
  .option('--reputation', 'Enable skillsmp.com reputation check (requires SKILLSMP_API_KEY)')
  .option('--db <path>', 'Path to SQLite database file', '.skillscan.db')
  .action(async (paths: string[], opts) => {
    const cwd = process.cwd();
    const config = loadConfig(cwd, opts.config);

    if (paths.length > 0) config.paths = paths;
    if (opts.failOn) config.qualityGate.failOn = opts.failOn;
    if (opts.minConfidence) config.qualityGate.minConfidence = parseInt(opts.minConfidence, 10);
    if (opts.llm) {
      config.llm = {
        provider: opts.llm,
        model: opts.model,
        apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY,
      };
    }
    if (opts.track) config.track = true;
    if (opts.reputation) {
      config.reputation = {
        enabled: true,
        apiKey: process.env.SKILLSMP_API_KEY,
      };
    }

    const formats: string[] = [];
    if (opts.terminal !== false) formats.push('terminal');
    if (opts.json) formats.push('json');
    if (opts.sarif) formats.push('sarif');
    if (opts.html) formats.push('html');
    if (formats.length === 0) formats.push('terminal');
    config.output.formats = formats as typeof config.output.formats;
    config.output.outputDir = opts.outputDir;

    let result;
    try {
      result = await scan(config, cwd);
    } catch (err) {
      console.error('Scan failed:', err instanceof Error ? err.message : String(err));
      process.exit(2);
    }

    const outputDir = resolve(cwd, config.output.outputDir ?? '.skillscan');

    if (config.output.formats.includes('terminal')) {
      renderTerminal(result, cwd, BANNER);
    }
    if (config.output.formats.includes('json')) {
      const p = renderJSON(result, outputDir);
      console.log(`JSON report: ${p}`);
    }
    if (config.output.formats.includes('sarif')) {
      const p = renderSARIF(result, outputDir, cwd);
      console.log(`SARIF report: ${p}`);
    }
    if (config.output.formats.includes('html')) {
      const p = renderHTML(result, outputDir, cwd);
      console.log(`HTML report: ${p}`);
    }

    process.exit(result.passed ? 0 : 1);
  });

program
  .command('serve [paths...]')
  .description('Launch the web dashboard with live file watching')
  .option('-c, --config <path>', 'Path to skillscan.yml config file')
  .option('-p, --port <number>', 'Port to listen on', '7117')
  .option('--llm <provider>', 'Enable LLM enrichment (claude|openai)')
  .option('--model <model>', 'LLM model to use')
  .option('--db <path>', 'Path to SQLite database file', '.skillscan.db')
  .action(async (paths: string[], opts) => {
    const cwd = process.cwd();
    const config = loadConfig(cwd, opts.config);

    if (paths.length > 0) config.paths = paths;
    if (opts.llm) {
      config.llm = {
        provider: opts.llm,
        model: opts.model,
        apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY,
      };
    }

    const dbPath = resolve(cwd, opts.db ?? '.skillscan.db');
    await serve({ config, cwd, port: parseInt(opts.port, 10), dbPath });
  });

program
  .command('rules')
  .description('List all available rules')
  .option('--json', 'Output as JSON')
  .action((opts) => {
    if (opts.json) {
      console.log(JSON.stringify(ALL_RULES.map((r) => ({
        id: r.id, name: r.name, severity: r.severity,
        category: r.category, requiresLLM: r.requiresLLM,
        description: r.description,
      })), null, 2));
      return;
    }

    console.log(`\n${BANNER} — Rules Catalog\n`);
    const byCategory = new Map<string, typeof ALL_RULES>();
    for (const rule of ALL_RULES) {
      const group = byCategory.get(rule.category) ?? [];
      group.push(rule);
      byCategory.set(rule.category, group);
    }

    for (const [category, rules] of byCategory) {
      console.log(`${category.toUpperCase()}`);
      for (const rule of rules) {
        const llm = rule.requiresLLM ? ' [LLM]' : '';
        console.log(`  ${rule.id.padEnd(14)} ${rule.severity.padEnd(10)} ${rule.name}${llm}`);
      }
      console.log('');
    }
  });

program
  .command('init')
  .description('Create a default skillscan.yml in the current directory')
  .action(() => {
    const configPath = join(process.cwd(), 'skillscan.yml');
    if (existsSync(configPath)) {
      console.error('skillscan.yml already exists.');
      process.exit(1);
    }
    const template = `scan:
  paths:
    - .claude/skills
    - skills
    - .claude

quality_gate:
  fail_on: critical

rules: {}

# llm:
#   provider: claude
#   model: claude-sonnet-5

output:
  formats:
    - terminal
    - sarif
  output_dir: .skillscan
`;
    writeFileSync(configPath, template);
    console.log('Created skillscan.yml');
  });

program.parse();
