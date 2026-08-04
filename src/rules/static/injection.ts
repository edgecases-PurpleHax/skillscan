import type { Rule, Finding, SkillContent } from '../../types.js';

function matchLines(
  content: SkillContent,
  patterns: RegExp[],
  ruleId: string,
  ruleName: string,
  message: string,
  remediation: string,
): Finding[] {
  const findings: Finding[] = [];
  for (let i = 0; i < content.lines.length; i++) {
    const line = content.lines[i];
    if (patterns.some((p) => p.test(line))) {
      findings.push({
        ruleId,
        ruleName,
        severity: 'blocker',
        category: 'injection',
        message,
        line: i + 1,
        snippet: line.trim(),
        remediation,
      });
    }
  }
  return findings;
}

export const IgnorePreviousInstructions: Rule = {
  id: 'SKILL-001',
  name: 'Ignore Previous Instructions',
  description: 'Detects classic prompt injection phrases that attempt to override prior context.',
  severity: 'blocker',
  category: 'injection',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return matchLines(
      content,
      [
        /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
        /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
        /forget\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
        /override\s+(all\s+)?previous\s+instructions?/i,
      ],
      'SKILL-001',
      'Ignore Previous Instructions',
      'Contains a phrase designed to suppress prior context and hijack the agent.',
      'Remove any instructions that attempt to override the parent context. Skills should extend, not replace, the agent\'s existing rules.',
    );
  },
};

export const RoleReassignment: Rule = {
  id: 'SKILL-002',
  name: 'Role Reassignment',
  description: 'Detects attempts to redefine the agent\'s identity or role.',
  severity: 'blocker',
  category: 'injection',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return matchLines(
      content,
      [
        /you\s+are\s+now\s+(a|an|the)\s+\w/i,
        /act\s+as\s+(a|an|the)\s+\w/i,
        /pretend\s+(you\s+are|to\s+be)\s+(a|an|the)\s+\w/i,
        /from\s+now\s+on[\s,]+you\s+(are|will\s+be)/i,
        /your\s+new\s+(role|identity|persona)\s+is/i,
      ],
      'SKILL-002',
      'Role Reassignment',
      'Contains instructions that attempt to redefine the agent\'s identity or persona.',
      'Skills should describe tasks, not redefine the agent. Remove role-reassignment language.',
    );
  },
};

export const SafetyBypass: Rule = {
  id: 'SKILL-003',
  name: 'Safety Bypass Instruction',
  description: 'Detects language attempting to disable safety behaviors or content filters.',
  severity: 'blocker',
  category: 'injection',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return matchLines(
      content,
      [
        /bypass\s+(safety|security|content|filter|guard|restriction|limit)/i,
        /disable\s+(safety|security|content|filter|guard|restriction)/i,
        /without\s+(any\s+)?(safety|restrictions?|limitations?|filters?)/i,
        /no\s+(restrictions?|limitations?|filters?|safeguards?|guardrails?)/i,
        /remove\s+(all\s+)?(restrictions?|limitations?|safeguards?)/i,
        /jailbreak/i,
        /DAN\s+mode/i,
      ],
      'SKILL-003',
      'Safety Bypass Instruction',
      'Contains language that attempts to disable safety behaviors or content filters.',
      'Remove any instructions that reference bypassing, disabling, or removing safety measures.',
    );
  },
};

export const HiddenDelimiter: Rule = {
  id: 'SKILL-004',
  name: 'Hidden Delimiter Injection',
  description: 'Detects injection attempts using fake system/assistant/user message delimiters.',
  severity: 'critical',
  category: 'injection',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return matchLines(
      content,
      [
        /<\|im_(start|end|sep)\|>/i,
        /\[INST\]|\[\/INST\]/,
        /<s>|<\/s>/,
        /###\s*(System|Assistant|Human|User)\s*:/i,
        /\[system\]|\[assistant\]|\[human\]/i,
      ],
      'SKILL-004',
      'Hidden Delimiter Injection',
      'Contains fake message delimiters used to inject synthetic conversation turns.',
      'Remove all delimiter-style tokens. Skills are plain text — they do not use chat-format delimiters.',
    );
  },
};
