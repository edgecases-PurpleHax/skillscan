import type { Rule, Finding, SkillContent } from '../../types.js';

export const Base64Payload: Rule = {
  id: 'SKILL-030',
  name: 'Base64 Encoded Payload',
  description: 'Detects base64 blobs that may conceal malicious instructions.',
  severity: 'critical',
  category: 'obfuscation',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    const findings: Finding[] = [];
    const base64Pattern = /[A-Za-z0-9+/]{60,}={0,2}/g;

    for (let i = 0; i < content.lines.length; i++) {
      const line = content.lines[i];
      const matches = line.match(base64Pattern);
      if (matches) {
        for (const match of matches) {
          try {
            const decoded = Buffer.from(match, 'base64').toString('utf-8');
            if (/[\x20-\x7E]{20,}/.test(decoded)) {
              findings.push({
                ruleId: 'SKILL-030',
                ruleName: 'Base64 Encoded Payload',
                severity: 'critical',
                category: 'obfuscation',
                message: `Base64 blob decodes to readable text: "${decoded.slice(0, 80)}${decoded.length > 80 ? '...' : ''}"`,
                line: i + 1,
                snippet: match.slice(0, 60) + '...',
                remediation: 'Remove base64-encoded content. All skill instructions must be written in plain, readable text.',
              });
            }
          } catch {
            // not valid base64
          }
        }
      }
    }
    return findings;
  },
};

export const HtmlCommentInjection: Rule = {
  id: 'SKILL-031',
  name: 'HTML Comment Injection',
  description: 'Detects instructions hidden inside HTML comments.',
  severity: 'major',
  category: 'obfuscation',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    const findings: Finding[] = [];
    const commentPattern = /<!--([\s\S]*?)-->/g;
    let match: RegExpExecArray | null;

    while ((match = commentPattern.exec(content.raw)) !== null) {
      const inner = match[1].trim();
      if (inner.length > 10) {
        const lineNumber = content.raw.slice(0, match.index).split('\n').length;
        findings.push({
          ruleId: 'SKILL-031',
          ruleName: 'HTML Comment Injection',
          severity: 'major',
          category: 'obfuscation',
          message: 'Instructions found inside an HTML comment block.',
          line: lineNumber,
          snippet: `<!-- ${inner.slice(0, 80)}${inner.length > 80 ? '...' : ''} -->`,
          remediation: 'Remove HTML comments. Skill instructions must be visible in plain text.',
        });
      }
    }
    return findings;
  },
};

export const UnicodeHomoglyph: Rule = {
  id: 'SKILL-032',
  name: 'Unicode Homoglyph or Zero-Width Character',
  description: 'Detects zero-width or visually deceptive Unicode characters used to hide content.',
  severity: 'critical',
  category: 'obfuscation',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    const findings: Finding[] = [];
    // Zero-width space, zero-width non-joiner, zero-width joiner, word joiner, etc.
    const zwPattern = /[​‌‍⁠﻿­]/g;

    for (let i = 0; i < content.lines.length; i++) {
      const line = content.lines[i];
      if (zwPattern.test(line)) {
        findings.push({
          ruleId: 'SKILL-032',
          ruleName: 'Unicode Homoglyph or Zero-Width Character',
          severity: 'critical',
          category: 'obfuscation',
          message: 'Line contains zero-width or invisible Unicode characters that may conceal instructions.',
          line: i + 1,
          snippet: line.trim(),
          remediation: 'Remove all zero-width characters. Use a plain text editor to inspect and clean the file.',
        });
        zwPattern.lastIndex = 0;
      }
    }
    return findings;
  },
};
