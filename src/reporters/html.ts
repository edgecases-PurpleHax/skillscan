import { writeFileSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import type { ScanResult, Severity } from '../types.js';

const SEV_COLOR: Record<Severity, string> = {
  info: '#06b6d4',
  minor: '#3b82f6',
  major: '#f59e0b',
  critical: '#ef4444',
  blocker: '#7f1d1d',
};

const SEV_BG: Record<Severity, string> = {
  info: '#ecfeff',
  minor: '#eff6ff',
  major: '#fffbeb',
  critical: '#fef2f2',
  blocker: '#fee2e2',
};

export function renderHTML(result: ScanResult, outputDir: string, cwd: string): string {
  mkdirSync(outputDir, { recursive: true });
  const outPath = join(outputDir, 'skillscan-report.html');

  const filesWithFindings = result.files.filter((f) => f.findings.length > 0);

  const filesSections = filesWithFindings.map((file) => {
    const rel = relative(cwd, file.filePath).replace(/\\/g, '/');
    const findingRows = file.findings.map((f) => {
      const color = SEV_COLOR[f.severity];
      const bg = SEV_BG[f.severity];
      return `
        <div class="finding" style="border-left: 4px solid ${color}; background: ${bg}; padding: 12px 16px; margin-bottom: 8px; border-radius: 4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="background:${color};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">${f.severity.toUpperCase()}</span>
            <span style="font-weight:600;font-size:13px;">[${f.ruleId}] ${escHtml(f.ruleName)}</span>
            ${f.line ? `<span style="color:#6b7280;font-size:12px;">line ${f.line}</span>` : ''}
          </div>
          <p style="margin:4px 0;font-size:13px;color:#111;">${escHtml(f.message)}</p>
          ${f.snippet ? `<pre style="margin:6px 0;padding:8px;background:#f3f4f6;border-radius:4px;font-size:12px;overflow-x:auto;">${escHtml(f.snippet.slice(0, 200))}</pre>` : ''}
          <p style="margin:4px 0;font-size:12px;color:#374151;"><strong>Fix:</strong> ${escHtml(f.remediation)}</p>
        </div>`;
    }).join('');

    return `
      <div class="file-section" style="margin-bottom:32px;">
        <h3 style="font-size:14px;font-family:monospace;background:#f3f4f6;padding:8px 12px;border-radius:4px;margin-bottom:12px;">
          📄 ${escHtml(rel)} <span style="color:#6b7280;font-weight:400;">(${file.findings.length} finding${file.findings.length !== 1 ? 's' : ''})</span>
        </h3>
        ${findingRows}
      </div>`;
  }).join('');

  const passColor = result.passed ? '#16a34a' : '#dc2626';
  const passText = result.passed ? '✔ PASSED' : '✖ FAILED';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SkillScan Report</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f9fafb; color: #111827; }
  .header { background: #111827; color: white; padding: 24px 32px; }
  .header h1 { margin: 0 0 4px; font-size: 22px; }
  .header p { margin: 0; color: #9ca3af; font-size: 13px; }
  .gate { display: inline-block; margin-top: 12px; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 14px; background: ${passColor}; color: white; }
  .content { max-width: 900px; margin: 32px auto; padding: 0 24px; }
  .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 32px; }
  .sev-card { text-align: center; padding: 16px 8px; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .sev-card .count { font-size: 28px; font-weight: 800; }
  .sev-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
  @media (prefers-color-scheme: dark) {
    body { background: #111827; color: #f9fafb; }
    .sev-card { background: #1f2937; }
    pre { background: #1f2937 !important; color: #d1d5db; }
    .file-section h3 { background: #1f2937 !important; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>SkillScan Security Report</h1>
  <p>Generated ${new Date().toISOString()} · ${result.files.length} files · ${result.durationMs}ms</p>
  <div class="gate">${passText}</div>
</div>
<div class="content">
  <div class="summary">
    ${(['blocker','critical','major','minor','info'] as Severity[]).map((s) => `
    <div class="sev-card">
      <div class="count" style="color:${SEV_COLOR[s]}">${result.bySeverity[s]}</div>
      <div class="label">${s}</div>
    </div>`).join('')}
  </div>
  ${filesWithFindings.length === 0
    ? '<p style="color:#16a34a;font-weight:600;font-size:16px;">✔ No issues found in any scanned file.</p>'
    : filesSections}
</div>
</body>
</html>`;

  writeFileSync(outPath, html);
  return outPath;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
