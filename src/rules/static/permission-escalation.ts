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
        category: 'permission-escalation',
        message,
        line: i + 1,
        snippet: line.trim(),
        remediation,
      });
    }
  }
  return findings;
}

export const AllowAllTools: Rule = {
  id: 'SKILL-050',
  name: 'Blanket Tool Permission Request',
  description: 'Detects instructions that attempt to grant or assume all-tool access.',
  severity: 'critical',
  category: 'permission-escalation',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /allow\s+(all|every)\s+tool/i,
        /grant\s+(all|full|complete)\s+(access|permission)/i,
        /you\s+(have|are\s+granted)\s+(full|complete|unrestricted)\s+(access|permission)/i,
        /use\s+any\s+tool\s+(you\s+)?(want|need|like)/i,
        /no\s+tool\s+(restrictions?|limitations?)/i,
      ],
      'SKILL-050',
      'Blanket Tool Permission Request',
      'critical',
      'Skill attempts to grant or assume unrestricted access to all tools.',
      'Skills must not request or claim blanket tool permissions. Specify only the tools the skill genuinely requires.',
    );
  },
};

export const SelfApproval: Rule = {
  id: 'SKILL-051',
  name: 'Self-Approval Instruction',
  description: 'Detects instructions that tell the agent to approve its own tool calls.',
  severity: 'blocker',
  category: 'permission-escalation',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /approve\s+(your\s+own|all\s+your)\s+(tool|command|action)/i,
        /auto[\s-]?approve\s+(all|every|any)/i,
        /automatically\s+approve/i,
        /say\s+"yes"\s+(to\s+)?(all|every|any)\s+(prompt|confirmation|request)/i,
        /confirm\s+without\s+asking/i,
      ],
      'SKILL-051',
      'Self-Approval Instruction',
      'blocker',
      'Skill instructs the agent to auto-approve its own tool calls or confirmations.',
      'Remove self-approval instructions. The user must always be in control of approval decisions.',
    );
  },
};

export const SettingsManipulation: Rule = {
  id: 'SKILL-052',
  name: 'Settings Manipulation',
  description: 'Detects instructions to modify Claude Code settings or permission files.',
  severity: 'critical',
  category: 'permission-escalation',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /settings\.json/i,
        /settings\.local\.json/i,
        /\.claude\/settings/i,
        /add\s+(to\s+)?(the\s+)?(allow|permission|trusted)\s+list/i,
        /modify\s+(the\s+)?claude\s+(config|settings|permissions)/i,
      ],
      'SKILL-052',
      'Settings Manipulation',
      'critical',
      'Skill references or attempts to modify Claude Code settings or permission configuration.',
      'Skills must not modify settings.json or permissions. Only the user may change Claude Code configuration.',
    );
  },
};
