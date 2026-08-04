import chalk, { type ChalkInstance } from 'chalk';
import { relative } from 'path';
import type { ScanResult, Severity } from '../types.js';

const SEVERITY_COLOR: Record<Severity, ChalkInstance> = {
  info: chalk.cyan,
  minor: chalk.blue,
  major: chalk.yellow,
  critical: chalk.red,
  blocker: chalk.bgRed.white.bold,
};

const SEVERITY_ICON: Record<Severity, string> = {
  info: 'ℹ',
  minor: '●',
  major: '▲',
  critical: '✖',
  blocker: '⛔',
};

export function renderTerminal(result: ScanResult, cwd: string, banner = 'SkillScan'): void {
  console.log('');
  console.log(chalk.bold(banner) + chalk.gray(' — Security Analysis'));
  console.log(chalk.gray('─'.repeat(60)));

  let hasFindings = false;

  for (const file of result.files) {
    if (file.findings.length === 0) continue;
    hasFindings = true;

    const rel = relative(cwd, file.filePath);
    console.log('');
    console.log(chalk.bold.white(`📄 ${rel}`));

    for (const finding of file.findings) {
      const color = SEVERITY_COLOR[finding.severity];
      const icon = SEVERITY_ICON[finding.severity];
      const loc = finding.line ? chalk.gray(`:${finding.line}`) : '';

      console.log(`  ${color(`${icon} [${finding.ruleId}]`)} ${color.bold(finding.ruleName)}${loc}`);
      console.log(`     ${chalk.white(finding.message)}`);
      if (finding.snippet) {
        console.log(`     ${chalk.gray('↳')} ${chalk.italic.gray(finding.snippet.slice(0, 100))}`);
      }
      console.log(`     ${chalk.gray('Fix:')} ${chalk.dim(finding.remediation)}`);
      console.log('');
    }
  }

  if (!hasFindings) {
    console.log(chalk.green('\n  ✔ No issues found.'));
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.bold('Summary'));
  console.log(`  Files scanned:  ${result.files.length}`);
  console.log(`  Total findings: ${result.totalFindings}`);
  console.log(`  Blockers:       ${SEVERITY_COLOR.blocker(String(result.bySeverity.blocker))}`);
  console.log(`  Critical:       ${SEVERITY_COLOR.critical(String(result.bySeverity.critical))}`);
  console.log(`  Major:          ${SEVERITY_COLOR.major(String(result.bySeverity.major))}`);
  console.log(`  Minor:          ${SEVERITY_COLOR.minor(String(result.bySeverity.minor))}`);
  console.log(`  Info:           ${SEVERITY_COLOR.info(String(result.bySeverity.info))}`);
  console.log(`  Duration:       ${result.durationMs}ms`);
  console.log('');

  if (result.passed) {
    console.log(chalk.bold.green('  ✔ ' + result.qualityGateMessage));
  } else {
    console.log(chalk.bold.red('  ✖ ' + result.qualityGateMessage));
  }
  console.log('');
}
