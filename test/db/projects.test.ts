import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import Database from 'better-sqlite3';
import { initDb } from '../../src/db/schema.js';
import {
  getOrCreateProject,
  listProjects,
  upsertScan,
  upsertFindings,
  insertReview,
  getAllReviews,
  invalidateFileReviews,
  computeReviewCoverage,
} from '../../src/db/client.js';
import type { FileScanResult } from '../../src/types.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'skillscan-db-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function sampleFiles(msg = 'Sends data to external host'): FileScanResult[] {
  return [
    {
      filePath: '/skills/a.md',
      findings: [
        {
          ruleId: 'SS-EXFIL-001',
          ruleName: 'Exfiltration',
          severity: 'critical',
          category: 'exfiltration',
          message: msg,
          remediation: 'Remove it',
          line: 5,
          snippet: 'curl evil.com',
        },
      ],
    },
  ];
}

describe('projects schema', () => {
  it('creates a default project on init', () => {
    const db = initDb(join(dir, 'test.db'));
    const projects = listProjects(db);
    expect(projects).toHaveLength(1);
    expect(projects[0].key).toBe('default');
    db.close();
  });

  it('getOrCreateProject is idempotent', () => {
    const db = initDb(join(dir, 'test.db'));
    const a = getOrCreateProject(db, 'corpus');
    const b = getOrCreateProject(db, 'corpus');
    expect(a.id).toBe(b.id);
    expect(listProjects(db)).toHaveLength(2);
    db.close();
  });

  it('dedups findings within a project across scans', () => {
    const db = initDb(join(dir, 'test.db'));
    const p = getOrCreateProject(db, 'corpus');
    const scan1 = upsertScan(db, p.id, ['x'], {});
    const first = upsertFindings(db, p.id, scan1, sampleFiles());
    const scan2 = upsertScan(db, p.id, ['x'], {});
    const second = upsertFindings(db, p.id, scan2, sampleFiles());
    expect(first[0].id).toBe(second[0].id);
    db.close();
  });

  it('keeps identical findings separate across projects', () => {
    const db = initDb(join(dir, 'test.db'));
    const p1 = getOrCreateProject(db, 'proj-1');
    const p2 = getOrCreateProject(db, 'proj-2');
    const s1 = upsertScan(db, p1.id, ['x'], {});
    const s2 = upsertScan(db, p2.id, ['x'], {});
    const f1 = upsertFindings(db, p1.id, s1, sampleFiles());
    const f2 = upsertFindings(db, p2.id, s2, sampleFiles());
    expect(f1[0].id).not.toBe(f2[0].id);
    db.close();
  });

  it('scopes reviews and stats per project', () => {
    const db = initDb(join(dir, 'test.db'));
    const p1 = getOrCreateProject(db, 'proj-1');
    const p2 = getOrCreateProject(db, 'proj-2');
    const f1 = upsertFindings(db, p1.id, upsertScan(db, p1.id, ['x'], {}), sampleFiles());
    upsertFindings(db, p2.id, upsertScan(db, p2.id, ['x'], {}), sampleFiles());

    insertReview(db, f1[0].id, 'accepted', 'tester');

    expect(getAllReviews(db, p1.id)).toHaveLength(1);
    expect(getAllReviews(db, p2.id)).toHaveLength(0);

    const summaries = listProjects(db, 'critical');
    const s1 = summaries.find((s) => s.key === 'proj-1')!;
    const s2 = summaries.find((s) => s.key === 'proj-2')!;
    expect(s1.unreviewedFindings).toBe(0);
    expect(s1.passed).toBe(true);
    expect(s2.unreviewedFindings).toBe(1);
    expect(s2.passed).toBe(false);
    db.close();
  });

  it('invalidateFileReviews only touches the given project', () => {
    const db = initDb(join(dir, 'test.db'));
    const p1 = getOrCreateProject(db, 'proj-1');
    const p2 = getOrCreateProject(db, 'proj-2');
    const f1 = upsertFindings(db, p1.id, upsertScan(db, p1.id, ['x'], {}), sampleFiles());
    const f2 = upsertFindings(db, p2.id, upsertScan(db, p2.id, ['x'], {}), sampleFiles());
    insertReview(db, f1[0].id, 'accepted', 'tester');
    insertReview(db, f2[0].id, 'accepted', 'tester');

    invalidateFileReviews(db, p1.id, '/skills/a.md');

    expect(getAllReviews(db, p1.id)).toHaveLength(0);
    expect(getAllReviews(db, p2.id)).toHaveLength(1);
    expect(computeReviewCoverage(db, p1.id, '/skills/a.md')).toBe(0);
    expect(computeReviewCoverage(db, p2.id, '/skills/a.md')).toBe(1);
    db.close();
  });
});

describe('pre-0.7.0 migration', () => {
  function buildOldDb(path: string): void {
    const db = new Database(path);
    db.exec(`
      CREATE TABLE scans (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT    NOT NULL,
        paths     TEXT    NOT NULL,
        config_json TEXT  NOT NULL
      );
      CREATE TABLE findings (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id      INTEGER NOT NULL REFERENCES scans(id),
        file_path    TEXT    NOT NULL,
        rule_id      TEXT    NOT NULL,
        line         INTEGER,
        snippet_hash TEXT    NOT NULL,
        severity     TEXT    NOT NULL,
        category     TEXT    NOT NULL,
        message      TEXT    NOT NULL,
        remediation  TEXT    NOT NULL,
        confidence   INTEGER,
        is_hotspot   INTEGER NOT NULL DEFAULT 0,
        UNIQUE(file_path, rule_id, line, snippet_hash)
      );
      CREATE TABLE reviews (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        finding_id INTEGER NOT NULL REFERENCES findings(id),
        decision   TEXT    NOT NULL CHECK(decision IN ('accepted','false-positive','wont-fix')),
        reviewer   TEXT    NOT NULL,
        timestamp  TEXT    NOT NULL,
        note       TEXT
      );
      CREATE TABLE files (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path       TEXT    NOT NULL UNIQUE,
        current_hash    TEXT    NOT NULL,
        last_scan_id    INTEGER REFERENCES scans(id),
        review_coverage REAL    NOT NULL DEFAULT 0
      );
      INSERT INTO scans (timestamp, paths, config_json) VALUES ('2026-01-01T00:00:00Z', '["x"]', '{}');
      INSERT INTO findings (scan_id, file_path, rule_id, line, snippet_hash, severity, category, message, remediation)
        VALUES (1, '/skills/old.md', 'SS-INJ-001', 3, 'abc123', 'critical', 'injection', 'old finding', 'fix it');
      INSERT INTO reviews (finding_id, decision, reviewer, timestamp) VALUES (1, 'accepted', 'old-reviewer', '2026-01-02T00:00:00Z');
      INSERT INTO files (file_path, current_hash, last_scan_id, review_coverage) VALUES ('/skills/old.md', 'deadbeef', 1, 1.0);
    `);
    db.close();
  }

  it('migrates existing data into the default project preserving reviews', () => {
    const path = join(dir, 'old.db');
    buildOldDb(path);

    const db = initDb(path);

    const projects = listProjects(db);
    expect(projects).toHaveLength(1);
    const def = projects[0];
    expect(def.key).toBe('default');
    expect(def.totalFindings).toBe(1);
    expect(def.unreviewedFindings).toBe(0);

    const reviews = getAllReviews(db, def.id);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].reviewer).toBe('old-reviewer');
    expect(reviews[0].filePath).toBe('/skills/old.md');

    // migrated DB accepts new-style writes
    const p2 = getOrCreateProject(db, 'new-proj');
    const f = upsertFindings(db, p2.id, upsertScan(db, p2.id, ['y'], {}), sampleFiles());
    expect(f[0].id).toBeGreaterThan(1);
    db.close();
  });

  it('is a no-op on an already-migrated database', () => {
    const path = join(dir, 'twice.db');
    buildOldDb(path);
    initDb(path).close();
    const db = initDb(path);
    expect(listProjects(db)[0].totalFindings).toBe(1);
    db.close();
  });
});
