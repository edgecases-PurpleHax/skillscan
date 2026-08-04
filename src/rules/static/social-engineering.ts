import type { Rule, Finding, SkillContent } from '../../types.js';

function scan(
  content: SkillContent,
  patterns: RegExp[],
  ruleId: string,
  ruleName: string,
  severity: Finding['severity'],
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
        severity,
        category: 'social-engineering',
        message,
        line: i + 1,
        snippet: line.trim(),
        remediation,
      });
    }
  }
  return findings;
}

export const UrgencyManipulation: Rule = {
  id: 'SKILL-040',
  name: 'Urgency Manipulation',
  description: 'Detects artificial urgency language used to bypass deliberation.',
  severity: 'major',
  category: 'social-engineering',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /this\s+is\s+(urgent|critical|an\s+emergency)/i,
        /do\s+(not|never)\s+(ask|confirm|verify|check|pause|stop|hesitate)/i,
        /without\s+(asking|confirming|verifying|checking|pausing)/i,
        /immediately\s+(execute|run|delete|send|push)/i,
        /skip\s+(confirmation|verification|review|approval)/i,
      ],
      'SKILL-040',
      'Urgency Manipulation',
      'major',
      'Skill uses urgency or imperative language to suppress confirmation steps.',
      'Remove language that discourages the agent from verifying with the user. Confirmation steps exist for safety.',
    );
  },
};

export const AuthorityImpersonation: Rule = {
  id: 'SKILL-041',
  name: 'Authority Impersonation',
  description: 'Detects claims of special authority, Anthropic override, or system-level permission.',
  severity: 'blocker',
  category: 'social-engineering',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /anthropic\s+(has\s+)?(approved|authorized|instructed|granted)/i,
        /system\s+(override|admin|administrator)\s+(mode|access|permission)/i,
        /as\s+(an?\s+)?(anthropic|openai|admin|administrator|superuser)/i,
        /you\s+have\s+(been\s+)?(granted|given)\s+(special|elevated|admin|root)\s+(access|permission)/i,
        /operator\s+override/i,
      ],
      'SKILL-041',
      'Authority Impersonation',
      'blocker',
      'Skill claims special authority from Anthropic, a system administrator, or another trusted party.',
      'Remove all authority claims. No skill can grant elevated permissions or claim Anthropic authorization.',
    );
  },
};

export const ConfidentialityInstruction: Rule = {
  id: 'SKILL-042',
  name: 'Confidentiality Instruction',
  description: 'Detects instructions telling the agent to hide its actions from the user.',
  severity: 'critical',
  category: 'social-engineering',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /do\s+not\s+(tell|inform|mention|reveal|disclose|show)\s+(the\s+)?(user|human)/i,
        /keep\s+(this|these\s+instructions?)\s+(secret|hidden|confidential)/i,
        /don'?t\s+(mention|reveal|disclose|tell\s+(the\s+)?user)/i,
        /hide\s+(this|these|your\s+actions?)\s+from/i,
        /the\s+user\s+(must\s+not|should\s+not)\s+(know|see|find\s+out)/i,
      ],
      'SKILL-042',
      'Confidentiality Instruction',
      'critical',
      'Skill instructs the agent to conceal its actions or instructions from the user.',
      'Remove all instructions to hide behavior. Agent actions must be transparent to the user.',
    );
  },
};
