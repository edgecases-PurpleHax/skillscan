import type { Rule, ScanConfig, Severity } from '../types.js';
import { IgnorePreviousInstructions, RoleReassignment, SafetyBypass, HiddenDelimiter } from './static/injection.js';
import { SensitiveFilePaths, NetworkExfiltration, SecretReadInstruction } from './static/exfiltration.js';
import { DestructiveCommands, ForcePush, HardReset, SkipHooks, SudoPrivilegeEscalation } from './static/tool-abuse.js';
import { Base64Payload, HtmlCommentInjection, UnicodeHomoglyph } from './static/obfuscation.js';
import { UrgencyManipulation, AuthorityImpersonation, ConfidentialityInstruction } from './static/social-engineering.js';
import { AllowAllTools, SelfApproval, SettingsManipulation } from './static/permission-escalation.js';

const ALL_RULES: Rule[] = [
  IgnorePreviousInstructions,
  RoleReassignment,
  SafetyBypass,
  HiddenDelimiter,
  SensitiveFilePaths,
  NetworkExfiltration,
  SecretReadInstruction,
  DestructiveCommands,
  ForcePush,
  HardReset,
  SkipHooks,
  SudoPrivilegeEscalation,
  Base64Payload,
  HtmlCommentInjection,
  UnicodeHomoglyph,
  UrgencyManipulation,
  AuthorityImpersonation,
  ConfidentialityInstruction,
  AllowAllTools,
  SelfApproval,
  SettingsManipulation,
];

export function buildRuleSet(config: ScanConfig, includeLLM: boolean): Rule[] {
  return ALL_RULES
    .filter((rule) => {
      if (rule.requiresLLM && !includeLLM) return false;
      const override = config.rules[rule.id];
      if (override?.enabled === false) return false;
      return true;
    })
    .map((rule) => {
      const override = config.rules[rule.id];
      if (override?.severity) {
        return { ...rule, severity: override.severity as Severity };
      }
      return rule;
    });
}

export { ALL_RULES };
