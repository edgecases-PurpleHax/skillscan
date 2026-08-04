import { writeFileSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import type { ScanResult, Severity, Rule } from '../types.js';
import { ALL_RULES } from '../rules/registry.js';

const SARIF_LEVEL: Record<Severity, string> = {
  info: 'note',
  minor: 'note',
  major: 'warning',
  critical: 'error',
  blocker: 'error',
};

export function renderSARIF(result: ScanResult, outputDir: string, cwd: string): string {
  mkdirSync(outputDir, { recursive: true });
  const outPath = join(outputDir, 'skillscan-report.sarif');

  const ruleMap = new Map<string, Rule>(ALL_RULES.map((r) => [r.id, r]));

  const rulesUsed = new Map<string, Rule>();
  for (const file of result.files) {
    for (const finding of file.findings) {
      const rule = ruleMap.get(finding.ruleId);
      if (rule) rulesUsed.set(rule.id, rule);
    }
  }

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'SkillScan',
            version: '0.1.0',
            informationUri: 'https://github.com/skillscan/skillscan',
            rules: [...rulesUsed.values()].map((rule) => ({
              id: rule.id,
              name: rule.name,
              shortDescription: { text: rule.description },
              defaultConfiguration: { level: SARIF_LEVEL[rule.severity] },
              properties: { tags: [rule.category] },
            })),
          },
        },
        results: result.files.flatMap((file) =>
          file.findings.map((finding) => ({
            ruleId: finding.ruleId,
            level: SARIF_LEVEL[finding.severity],
            message: { text: finding.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: relative(cwd, file.filePath).replace(/\\/g, '/'),
                    uriBaseId: '%SRCROOT%',
                  },
                  region: finding.line
                    ? { startLine: finding.line }
                    : undefined,
                },
              },
            ],
            fixes: [
              {
                description: { text: finding.remediation },
              },
            ],
          })),
        ),
      },
    ],
  };

  writeFileSync(outPath, JSON.stringify(sarif, null, 2));
  return outPath;
}
