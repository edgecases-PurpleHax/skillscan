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
        category: 'tool-abuse',
        message,
        line: i + 1,
        snippet: line.trim(),
        remediation,
      });
    }
  }
  return findings;
}

export const DestructiveCommands: Rule = {
  id: 'SKILL-020',
  name: 'Destructive Command',
  description: 'Detects instructions to run destructive shell commands.',
  severity: 'blocker',
  category: 'tool-abuse',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /rm\s+-rf?\s+[\/~]/i,
        /rm\s+-rf?\s+\*/i,
        /del\s+\/[sqf]/i,
        /format\s+[a-z]:/i,
        /mkfs\./i,
        /dd\s+if=\/dev\/zero/i,
        />\s*\/dev\/sd[a-z]/i,
        /shred\s+/i,
      ],
      'SKILL-020',
      'Destructive Command',
      'blocker',
      'Skill contains a destructive command that could cause irreversible data loss.',
      'Remove destructive shell commands. If deletion is required by the skill\'s purpose, scope it narrowly with explicit paths.',
    );
  },
};

export const ForcePush: Rule = {
  id: 'SKILL-021',
  name: 'Force Push Instruction',
  description: 'Detects instructions to force-push to git remotes.',
  severity: 'critical',
  category: 'tool-abuse',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /git\s+push\s+.*--force/i,
        /git\s+push\s+.*-f\b/i,
        /git\s+push\s+--force-with-lease/i,
      ],
      'SKILL-021',
      'Force Push Instruction',
      'critical',
      'Skill instructs the agent to force-push, which can destroy remote history.',
      'Remove force-push instructions. Document why it is needed in a PR description instead.',
    );
  },
};

export const HardReset: Rule = {
  id: 'SKILL-022',
  name: 'Hard Reset Instruction',
  description: 'Detects instructions to run git reset --hard, discarding uncommitted work.',
  severity: 'critical',
  category: 'tool-abuse',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /git\s+reset\s+--hard/i,
        /git\s+clean\s+.*-f/i,
        /git\s+checkout\s+--\s+\./i,
      ],
      'SKILL-022',
      'Hard Reset Instruction',
      'critical',
      'Skill instructs the agent to hard reset or force-clean the working tree.',
      'Use stash or branch switching instead of hard reset. If truly required, gate it behind an explicit user confirmation step.',
    );
  },
};

export const SkipHooks: Rule = {
  id: 'SKILL-023',
  name: 'Hook Skip Instruction',
  description: 'Detects instructions to bypass git hooks with --no-verify.',
  severity: 'major',
  category: 'tool-abuse',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [/git\s+(commit|push)\s+.*--no-verify/i],
      'SKILL-023',
      'Hook Skip Instruction',
      'major',
      'Skill instructs the agent to bypass git hooks with --no-verify.',
      'Remove --no-verify. If hooks are failing, fix the underlying issue rather than skipping validation.',
    );
  },
};

export const SudoPrivilegeEscalation: Rule = {
  id: 'SKILL-024',
  name: 'Privilege Escalation via sudo',
  description: 'Detects unprompted use of sudo or su for privilege escalation.',
  severity: 'critical',
  category: 'tool-abuse',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /\bsudo\s+(rm|chmod|chown|dd|mkfs|format|kill|systemctl|service)\b/i,
        /\bsu\s+-\s*root/i,
        /chmod\s+777/i,
        /chmod\s+-R\s+777/i,
      ],
      'SKILL-024',
      'Privilege Escalation via sudo',
      'critical',
      'Skill instructs the agent to run privileged commands without user confirmation.',
      'Remove blanket sudo usage. If elevated permissions are required, document why and prompt the user explicitly.',
    );
  },
};
