import { createHash } from 'crypto';
import type { Finding } from '../types.js';

const SMP_API_BASE = 'https://skillsmp.com/api/v1';

function hashContent(content: string): string {
  return 'sha256:' + createHash('sha256').update(content, 'utf-8').digest('hex');
}

function extractSkillName(filePath: string, raw: string): string | null {
  const frontmatter = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatter) {
    const m = frontmatter[1].match(/^name:\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  const parts = filePath.split(/[/\\]/);
  const filename = parts[parts.length - 1] ?? '';
  return filename.replace(/\.[^.]+$/, '') || null;
}

interface SkillRecord {
  name?: string;
  malicious?: boolean;
  is_malicious?: boolean;
  hash?: string;
  content_hash?: string;
  patterns?: string[];
}

export async function checkReputation(
  filePath: string,
  raw: string,
  apiKey: string,
): Promise<Finding | null> {
  const name = extractSkillName(filePath, raw);
  if (!name) return null;

  let records: SkillRecord[] = [];
  try {
    const resp = await fetch(
      `${SMP_API_BASE}/skills/search?q=${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!resp.ok) return null;
    const body = await resp.json() as Record<string, unknown>;
    const data = body.data ?? body.skills ?? body.results ?? [];
    records = Array.isArray(data) ? (data as SkillRecord[]) : [];
  } catch {
    return null;
  }

  const fileHash = hashContent(raw);
  const nameLower = name.toLowerCase();

  for (const record of records) {
    const recName = (record.name ?? '').toLowerCase();
    if (recName !== nameLower) continue;
    if (record.malicious !== true && record.is_malicious !== true) continue;

    const recHash = record.hash ?? record.content_hash;
    if (recHash && recHash !== fileHash) continue;

    const patterns = (record.patterns ?? []).join(', ');
    return {
      ruleId: 'SKILL-REP-001',
      ruleName: 'Reputation: Known Malicious Skill',
      severity: 'blocker',
      category: 'injection',
      message: `Skill "${name}" matches a known-malicious entry on skillsmp.com${patterns ? `: ${patterns}` : ''}`,
      remediation: 'Remove this skill or audit it thoroughly before use.',
      confidence: 100,
    };
  }

  return null;
}
