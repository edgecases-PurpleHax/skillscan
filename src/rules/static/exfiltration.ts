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
        category: 'exfiltration',
        message,
        line: i + 1,
        snippet: line.trim(),
        remediation,
      });
    }
  }
  return findings;
}

export const SensitiveFilePaths: Rule = {
  id: 'SKILL-010',
  name: 'Sensitive File Path Reference',
  description: 'Detects references to credential files, env vars, or SSH keys.',
  severity: 'critical',
  category: 'exfiltration',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /\.env(\b|$)/i,
        /\/\.ssh\//i,
        /id_rsa|id_ed25519|id_ecdsa/i,
        /credentials?\.json/i,
        /secrets?\.json/i,
        /service.account/i,
        /\.aws\/credentials/i,
        /\.netrc/i,
        /\/etc\/passwd/i,
        /\/etc\/shadow/i,
      ],
      'SKILL-010',
      'Sensitive File Path Reference',
      'critical',
      'Skill references a path commonly associated with credentials or secrets.',
      'Unless the skill\'s explicit purpose is credential management, remove references to sensitive paths.',
    );
  },
};

export const NetworkExfiltration: Rule = {
  id: 'SKILL-011',
  name: 'Network Exfiltration Pattern',
  description: 'Detects instructions to send data to external URLs or services.',
  severity: 'blocker',
  category: 'exfiltration',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /curl\s+.*\$\{?[A-Z_]+\}?/i,
        /fetch\s*\(.*\$\{/i,
        /wget\s+.*\$\{?[A-Z_]+\}?/i,
        /send\s+(the\s+)?(output|result|content|data|key|token|secret)\s+(to|via)\s+(http|url|webhook|slack|discord|telegram)/i,
        /post\s+(it|this|the\s+\w+)\s+to\s+https?:\/\//i,
        /exfiltrat/i,
      ],
      'SKILL-011',
      'Network Exfiltration Pattern',
      'blocker',
      'Skill contains instructions to send data to an external network destination.',
      'Skills must not instruct the agent to POST or transmit file contents or secrets to external URLs.',
    );
  },
};

export const SecretReadInstruction: Rule = {
  id: 'SKILL-012',
  name: 'Secret Read Instruction',
  description: 'Detects explicit instructions to read secrets, tokens, or API keys.',
  severity: 'critical',
  category: 'exfiltration',
  requiresLLM: false,
  check(content: SkillContent): Finding[] {
    return scan(
      content,
      [
        /read\s+(the\s+)?(api[\s_-]?key|secret|token|password|private[\s_-]?key)/i,
        /cat\s+.*\.(env|key|pem|p12|pfx)/i,
        /echo\s+\$[A-Z_]*(KEY|TOKEN|SECRET|PASSWORD|PASS)\b/i,
        /print\s+(your\s+)?(api[\s_-]?key|access\s+token|secret)/i,
      ],
      'SKILL-012',
      'Secret Read Instruction',
      'critical',
      'Skill explicitly instructs the agent to read or print a secret value.',
      'Remove any instruction that directs the agent to read, display, or relay secret values.',
    );
  },
};
