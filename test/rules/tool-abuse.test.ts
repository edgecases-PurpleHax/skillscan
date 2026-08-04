import { describe, it, expect } from 'vitest';
import {
  DestructiveCommands,
  ForcePush,
  HardReset,
  SkipHooks,
  SudoPrivilegeEscalation,
} from '../../src/rules/static/tool-abuse.js';
import type { SkillContent } from '../../src/types.js';

function skill(raw: string): SkillContent {
  return { filePath: 'test.md', raw, lines: raw.split('\n') };
}

describe('SKILL-020 DestructiveCommands', () => {
  it('flags rm -rf /', () => {
    expect(DestructiveCommands.check(skill('rm -rf /'))).toHaveLength(1);
  });

  it('flags rm -rf *', () => {
    expect(DestructiveCommands.check(skill('rm -rf *'))).toHaveLength(1);
  });

  it('flags dd if=/dev/zero', () => {
    expect(DestructiveCommands.check(skill('dd if=/dev/zero of=/dev/sda'))).toHaveLength(1);
  });

  it('does not flag safe rm', () => {
    expect(DestructiveCommands.check(skill('rm build/output.js'))).toHaveLength(0);
  });
});

describe('SKILL-021 ForcePush', () => {
  it('flags git push --force', () => {
    expect(ForcePush.check(skill('git push origin main --force'))).toHaveLength(1);
  });

  it('flags git push -f', () => {
    expect(ForcePush.check(skill('git push -f'))).toHaveLength(1);
  });

  it('flags --force-with-lease', () => {
    expect(ForcePush.check(skill('git push --force-with-lease'))).toHaveLength(1);
  });

  it('does not flag normal push', () => {
    expect(ForcePush.check(skill('git push origin main'))).toHaveLength(0);
  });
});

describe('SKILL-022 HardReset', () => {
  it('flags git reset --hard', () => {
    expect(HardReset.check(skill('git reset --hard HEAD~1'))).toHaveLength(1);
  });

  it('flags git clean -f', () => {
    expect(HardReset.check(skill('git clean -f'))).toHaveLength(1);
  });

  it('does not flag git reset --soft', () => {
    expect(HardReset.check(skill('git reset --soft HEAD~1'))).toHaveLength(0);
  });
});

describe('SKILL-023 SkipHooks', () => {
  it('flags git commit --no-verify', () => {
    expect(SkipHooks.check(skill('git commit -m "fix" --no-verify'))).toHaveLength(1);
  });

  it('flags git push --no-verify', () => {
    expect(SkipHooks.check(skill('git push --no-verify'))).toHaveLength(1);
  });

  it('does not flag normal commit', () => {
    expect(SkipHooks.check(skill('git commit -m "fix lint"'))).toHaveLength(0);
  });
});

describe('SKILL-024 SudoPrivilegeEscalation', () => {
  it('flags sudo rm', () => {
    expect(SudoPrivilegeEscalation.check(skill('sudo rm -rf /var/log'))).toHaveLength(1);
  });

  it('flags chmod 777', () => {
    expect(SudoPrivilegeEscalation.check(skill('chmod 777 /app'))).toHaveLength(1);
  });

  it('flags su -root', () => {
    expect(SudoPrivilegeEscalation.check(skill('su - root'))).toHaveLength(1);
  });

  it('does not flag sudo apt install', () => {
    expect(SudoPrivilegeEscalation.check(skill('sudo apt install git'))).toHaveLength(0);
  });
});
