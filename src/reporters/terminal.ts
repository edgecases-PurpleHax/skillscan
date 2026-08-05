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

const ALERT_ICON: Record<string, string> = {
  regression: '⛔',
  'confidence-spike': '⚠',
  'file-changed': '~',
  'new-findings': '⚠',
};

const ALERT_COLOR: Record<string, ChalkInstance> = {
  regression: chalk.red,
  'confidence-spike': chalk.yellow,
  'file-changed': chalk.cyan,
  'new-findings': chalk.yellow,
};

export function renderTerminal(result: ScanResult, cwd: string, banner = 'SkillScan'): void {
  console.log('');
  console.log(chalk.bold(banner) + chalk.gray(' — Security Analysis'));
  console.log(chalk.gray('─'.repeat(60)));

  if (result.trackingBaseline) {
    console.log(chalk.cyan('\n  ✔ Integrity baseline created — .skillscan-lock.json'));
    console.log(chalk.gray('    Commit this file so future scans can detect skill changes.\n'));
  } else if (result.trackingAlerts && result.trackingAlerts.length > 0) {
    console.log('');
    console.log(chalk.bold.yellow('  INTEGRITY ALERTS'));
    for (const alert of result.trackingAlerts) {
      const rel = relative(cwd, alert.filePath);
      const color = ALERT_COLOR[alert.type] ?? chalk.yellow;
      const icon = ALERT_ICON[alert.type] ?? '⚠';
      console.log(`\n  ${color(`${icon} [${alert.type.toUpperCase()}]`)} ${chalk.bold(rel)}`);
      console.log(`     ${chalk.white(alert.message)}`);
    }
    console.log('');
    console.log(chalk.gray('─'.repeat(60)));
  }

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

      let confidenceTag = '';
      if (finding.confidence !== undefined) {
        if (finding.isHotspot || finding.confidence < 50) {
          confidenceTag = chalk.yellow(` [HOTSPOT ${finding.confidence}%]`);
        } else if (finding.confidence < 80) {
          confidenceTag = chalk.yellow(` [REVIEW ${finding.confidence}%]`);
        } else {
          confidenceTag = chalk.red(` [${finding.confidence}% confidence]`);
        }
      }

      console.log(`  ${color(`${icon} [${finding.ruleId}]`)} ${color.bold(finding.ruleName)}${loc}${confidenceTag}`);
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
