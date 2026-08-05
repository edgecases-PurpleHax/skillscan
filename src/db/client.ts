import { createHash } from 'crypto';
import type Database from 'better-sqlite3';
import type { Finding, FileScanResult, Project, ProjectSummary, Severity } from '../types.js';
import type { ReviewDecision, Review, DbFinding } from '../types.js';
import { SEVERITY_ORDER } from '../types.js';

export function snippetHash(finding: Finding): string {
  const key = `${finding.ruleId}:${finding.line ?? 0}:${finding.snippet ?? finding.message}`;
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

export function getOrCreateProject(db: Database.Database, key: string, name?: string): Project {
  const existing = db.prepare(`SELECT id, key, name, created_at AS createdAt FROM projects WHERE key=?`).get(key) as Project | undefined;
  if (existing) return existing;
  const createdAt = new Date().toISOString();
  const result = db.prepare(`INSERT INTO projects (key, name, created_at) VALUES (?, ?, ?)`)
    .run(key, name ?? key, createdAt);
  return { id: result.lastInsertRowid as number, key, name: name ?? key, createdAt };
}

export function listProjects(db: Database.Database, failOn: Severity = 'critical'): ProjectSummary[] {
  const projects = db.prepare(`SELECT id, key, name, created_at AS createdAt FROM projects ORDER BY name`).all() as Project[];
  const failLevel = SEVERITY_ORDER[failOn];

  return projects.map((p) => {
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM findings WHERE project_id=?`).get(p.id) as { c: number }).c;
    const nonHotspot = (db.prepare(`SELECT COUNT(*) AS c FROM findings WHERE project_id=? AND is_hotspot=0`).get(p.id) as { c: number }).c;
    const reviewed = (db.prepare(`
      SELECT COUNT(DISTINCT f.id) AS c FROM findings f
      JOIN reviews r ON r.finding_id = f.id
      WHERE f.project_id=? AND f.is_hotspot=0
    `).get(p.id) as { c: number }).c;
    const unreviewedGating = (db.prepare(`
      SELECT COUNT(*) AS c FROM findings f
      WHERE f.project_id=? AND f.is_hotspot=0
        AND f.severity IN (${Object.entries(SEVERITY_ORDER).filter(([, v]) => v >= failLevel).map(([k]) => `'${k}'`).join(',')})
        AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.finding_id = f.id)
    `).get(p.id) as { c: number }).c;
    const lastScan = db.prepare(`SELECT timestamp FROM scans WHERE project_id=? ORDER BY timestamp DESC LIMIT 1`).get(p.id) as { timestamp: string } | undefined;

    return {
      ...p,
      totalFindings: total,
      unreviewedFindings: nonHotspot - reviewed,
      reviewCoverage: nonHotspot === 0 ? 1 : reviewed / nonHotspot,
      lastScanAt: lastScan?.timestamp ?? null,
      passed: unreviewedGating === 0,
    };
  });
}

export function upsertScan(
  db: Database.Database,
  projectId: number,
  paths: string[],
  config: object,
): number {
  const stmt = db.prepare(`
    INSERT INTO scans (project_id, timestamp, paths, config_json)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(projectId, new Date().toISOString(), JSON.stringify(paths), JSON.stringify(config));
  return result.lastInsertRowid as number;
}

export function upsertFindings(
  db: Database.Database,
  projectId: number,
  scanId: number,
  fileResults: FileScanResult[],
): DbFinding[] {
  const upsert = db.prepare(`
    INSERT INTO findings (project_id, scan_id, file_path, rule_id, line, snippet_hash, severity, category, message, remediation, confidence, is_hotspot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, file_path, rule_id, line, snippet_hash) DO UPDATE SET
      scan_id    = excluded.scan_id,
      severity   = excluded.severity,
      message    = excluded.message,
      remediation = excluded.remediation,
      confidence = excluded.confidence,
      is_hotspot = excluded.is_hotspot
  `);

  const selectId = db.prepare(`
    SELECT id FROM findings WHERE project_id=? AND file_path=? AND rule_id=? AND line IS ? AND snippet_hash=?
  `);

  const inserted: DbFinding[] = [];

  const run = db.transaction(() => {
    for (const fr of fileResults) {
      for (const f of fr.findings) {
        const hash = snippetHash(f);
        upsert.run(
          projectId,
          scanId,
          fr.filePath,
          f.ruleId,
          f.line ?? null,
          hash,
          f.severity,
          f.category,
          f.message,
          f.remediation,
          f.confidence ?? null,
          f.isHotspot ? 1 : 0,
        );
        const row = selectId.get(projectId, fr.filePath, f.ruleId, f.line ?? null, hash) as { id: number };
        inserted.push({ ...f, id: row.id, filePath: fr.filePath, snippetHash: hash });
      }
    }
  });

  run();
  return inserted;
}

export function getLatestReview(db: Database.Database, findingId: number): Review | null {
  const row = db.prepare(`
    SELECT r.id, r.finding_id, r.decision, r.reviewer, r.timestamp, r.note
    FROM reviews r
    WHERE r.finding_id = ?
    ORDER BY r.timestamp DESC
    LIMIT 1
  `).get(findingId) as (Review & { finding_id: number }) | undefined;
  if (!row) return null;
  return {
    id: row.id,
    findingId: row.finding_id,
    decision: row.decision as ReviewDecision,
    reviewer: row.reviewer,
    timestamp: row.timestamp,
    note: row.note ?? undefined,
  };
}

export function insertReview(
  db: Database.Database,
  findingId: number,
  decision: ReviewDecision,
  reviewer: string,
  note?: string,
): Review {
  const stmt = db.prepare(`
    INSERT INTO reviews (finding_id, decision, reviewer, timestamp, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  const ts = new Date().toISOString();
  const result = stmt.run(findingId, decision, reviewer, ts, note ?? null);
  return {
    id: result.lastInsertRowid as number,
    findingId,
    decision,
    reviewer,
    timestamp: ts,
    note,
  };
}

export function getAllReviews(
  db: Database.Database,
  projectId?: number,
): Array<Review & { filePath: string; ruleId: string }> {
  const where = projectId != null ? 'WHERE f.project_id = ?' : '';
  const stmt = db.prepare(`
    SELECT r.id, r.finding_id AS findingId, r.decision, r.reviewer, r.timestamp, r.note,
           f.file_path AS filePath, f.rule_id AS ruleId
    FROM reviews r
    JOIN findings f ON f.id = r.finding_id
    ${where}
    ORDER BY r.timestamp DESC
  `);
  const rows = projectId != null ? stmt.all(projectId) : stmt.all();
  return rows as Array<Review & { filePath: string; ruleId: string }>;
}

export function getUnreviewedFindings(db: Database.Database, projectId: number): DbFinding[] {
  return db.prepare(`
    SELECT f.*
    FROM findings f
    WHERE f.project_id = ?
      AND f.is_hotspot = 0
      AND NOT EXISTS (
        SELECT 1 FROM reviews r WHERE r.finding_id = f.id
      )
  `).all(projectId) as DbFinding[];
}

export function upsertFile(
  db: Database.Database,
  projectId: number,
  filePath: string,
  currentHash: string,
  scanId: number,
  reviewCoverage: number,
): void {
  db.prepare(`
    INSERT INTO files (project_id, file_path, current_hash, last_scan_id, review_coverage)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(project_id, file_path) DO UPDATE SET
      current_hash    = excluded.current_hash,
      last_scan_id    = excluded.last_scan_id,
      review_coverage = excluded.review_coverage
  `).run(projectId, filePath, currentHash, scanId, reviewCoverage);
}

export function getFileRecord(
  db: Database.Database,
  projectId: number,
  filePath: string,
): { currentHash: string; reviewCoverage: number } | null {
  const row = db.prepare(`SELECT current_hash, review_coverage FROM files WHERE project_id=? AND file_path=?`).get(projectId, filePath) as
    | { current_hash: string; review_coverage: number }
    | undefined;
  if (!row) return null;
  return { currentHash: row.current_hash, reviewCoverage: row.review_coverage };
}

export function invalidateFileReviews(db: Database.Database, projectId: number, filePath: string): void {
  db.prepare(`
    DELETE FROM reviews
    WHERE finding_id IN (SELECT id FROM findings WHERE project_id = ? AND file_path = ?)
  `).run(projectId, filePath);
}

export function getFindingWithReview(
  db: Database.Database,
  findingId: number,
): (DbFinding & { review: Review | null }) | null {
  const finding = db.prepare(`SELECT * FROM findings WHERE id=?`).get(findingId) as (Record<string, unknown>) | undefined;
  if (!finding) return null;
  const review = getLatestReview(db, findingId);
  return {
    id: finding['id'] as number,
    filePath: finding['file_path'] as string,
    ruleId: finding['rule_id'] as string,
    ruleName: finding['rule_id'] as string,
    line: finding['line'] as number | undefined,
    snippetHash: finding['snippet_hash'] as string,
    severity: finding['severity'] as import('../types.js').Severity,
    category: finding['category'] as import('../types.js').Category,
    message: finding['message'] as string,
    remediation: finding['remediation'] as string,
    confidence: finding['confidence'] as number | undefined,
    isHotspot: Boolean(finding['is_hotspot']),
    review,
  };
}

export function computeReviewCoverage(db: Database.Database, projectId: number, filePath: string): number {
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM findings WHERE project_id=? AND file_path=? AND is_hotspot=0`).get(projectId, filePath) as { c: number }).c;
  if (total === 0) return 1;
  const reviewed = (db.prepare(`
    SELECT COUNT(DISTINCT f.id) AS c
    FROM findings f
    JOIN reviews r ON r.finding_id = f.id
    WHERE f.project_id=? AND f.file_path=? AND f.is_hotspot=0
  `).get(projectId, filePath) as { c: number }).c;
  return reviewed / total;
}
