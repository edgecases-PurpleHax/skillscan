import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync, watch } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';
import type { ScanConfig, ScanResult, FileScanResult, Severity } from '../types.js';
import type { ReviewDecision } from '../types.js';
import { SEVERITY_ORDER } from '../types.js';
import { scan } from '../core/scanner.js';
import { ALL_RULES } from '../rules/registry.js';
import { buildDashboardHTML } from './dashboard.js';
import { initDb } from '../db/schema.js';
import {
  getOrCreateProject,
  listProjects,
  upsertScan,
  upsertFindings,
  insertReview,
  getAllReviews,
  upsertFile,
  computeReviewCoverage,
  invalidateFileReviews,
  getFileRecord,
  getLatestReview,
  snippetHash,
} from '../db/client.js';
import type Database from 'better-sqlite3';
import type { DbFinding } from '../types.js';

interface ServeOptions {
  config: ScanConfig;
  cwd: string;
  port: number;
  dbPath: string;
  token?: string;
  project?: string;
}

interface ScanPayload {
  project: string;
  timestamp: string;
  durationMs: number;
  totalFindings: number;
  bySeverity: ScanResult['bySeverity'];
  passed: boolean;
  qualityGateMessage: string;
  unreviewedFindings: number;
  reviewCoverage: number;
  files: ScanResult['files'];
  rules: Array<{ id: string; name: string; severity: string; category: string; description: string; requiresLLM: boolean }>;
}

function fileHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 32);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const RULES_PAYLOAD = ALL_RULES.map((r) => ({
  id: r.id,
  name: r.name,
  severity: r.severity,
  category: r.category,
  description: r.description,
  requiresLLM: r.requiresLLM,
}));

export async function serve(opts: ServeOptions): Promise<void> {
  const { config, cwd, port, dbPath, token } = opts;
  const localProjectKey = opts.project ?? 'default';

  const db: Database.Database = initDb(dbPath);
  const localProject = getOrCreateProject(db, localProjectKey);
  const payloads = new Map<string, ScanPayload>();
  const sseClients = new Set<ServerResponse>();

  function broadcast(event: string, data?: unknown) {
    const msg = data
      ? `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      : `event: ${event}\ndata: {}\n\n`;
    for (const res of sseClients) {
      try { res.write(msg); } catch { sseClients.delete(res); }
    }
  }

  function attachIds(files: FileScanResult[], dbFindings: DbFinding[]): FileScanResult[] {
    const idMap = new Map<string, number>();
    for (const dbf of dbFindings) {
      idMap.set(`${dbf.filePath}:${dbf.ruleId}:${dbf.line ?? 0}:${dbf.snippetHash}`, dbf.id);
    }
    return files.map((fr) => ({
      ...fr,
      findings: fr.findings.map((f) => ({
        ...f,
        id: idMap.get(`${fr.filePath}:${f.ruleId}:${f.line ?? 0}:${snippetHash(f)}`),
      })),
    }));
  }

  function reviewStats(dbFindings: DbFinding[]) {
    const nonHotspot = dbFindings.filter((d) => !d.isHotspot);
    const reviewed = nonHotspot.filter((d) => getLatestReview(db, d.id) !== null).length;
    const failOn = (config.qualityGate?.failOn ?? 'critical') as Severity;
    const failLevel = SEVERITY_ORDER[failOn];
    const unreviewedGating = nonHotspot.filter(
      (d) => SEVERITY_ORDER[d.severity] >= failLevel && getLatestReview(db, d.id) === null,
    ).length;
    return {
      unreviewedFindings: nonHotspot.length - reviewed,
      reviewCoverage: nonHotspot.length === 0 ? 1 : reviewed / nonHotspot.length,
      unreviewedGating,
      failOn,
    };
  }

  async function runScan() {
    broadcast('scanning', { project: localProject.key });
    try {
      const result = await scan(config, cwd);

      const scanId = upsertScan(db, localProject.id, config.paths, config);
      const dbFindings = upsertFindings(db, localProject.id, scanId, result.files);

      for (const fr of result.files) {
        const raw = readFileSync(fr.filePath, 'utf-8');
        const hash = fileHash(raw);
        const prev = getFileRecord(db, localProject.id, fr.filePath);
        if (prev && prev.currentHash !== hash) {
          invalidateFileReviews(db, localProject.id, fr.filePath);
        }
        const coverage = computeReviewCoverage(db, localProject.id, fr.filePath);
        upsertFile(db, localProject.id, fr.filePath, hash, scanId, coverage);
      }

      const stats = reviewStats(dbFindings);
      const payload: ScanPayload = {
        project: localProject.key,
        timestamp: new Date().toISOString(),
        durationMs: result.durationMs,
        totalFindings: result.totalFindings,
        bySeverity: result.bySeverity,
        passed: result.passed,
        qualityGateMessage: result.qualityGateMessage,
        unreviewedFindings: stats.unreviewedFindings,
        reviewCoverage: stats.reviewCoverage,
        files: attachIds(result.files, dbFindings),
        rules: RULES_PAYLOAD,
      };
      payloads.set(localProject.key, payload);
      broadcast('scan-complete', payload);
    } catch (err) {
      broadcast('scan-error', { project: localProject.key, message: String(err) });
    }
  }

  function ingestScan(projectKey: string, files: FileScanResult[]): ScanPayload {
    const project = getOrCreateProject(db, projectKey);
    const scanId = upsertScan(db, project.id, config.paths, config);
    const dbFindings = upsertFindings(db, project.id, scanId, files);

    const bySeverity: Record<Severity, number> = { info: 0, minor: 0, major: 0, critical: 0, blocker: 0 };
    let totalFindings = 0;
    for (const fr of files) {
      for (const f of fr.findings) {
        totalFindings++;
        bySeverity[f.severity]++;
      }
    }

    const stats = reviewStats(dbFindings);
    const passed = stats.unreviewedGating === 0;

    const payload: ScanPayload = {
      project: project.key,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      totalFindings,
      bySeverity,
      passed,
      qualityGateMessage: passed
        ? 'Quality gate passed'
        : `${stats.unreviewedGating} unreviewed finding(s) at or above ${stats.failOn}`,
      unreviewedFindings: stats.unreviewedFindings,
      reviewCoverage: stats.reviewCoverage,
      files: attachIds(files, dbFindings),
      rules: RULES_PAYLOAD,
    };
    payloads.set(project.key, payload);
    return payload;
  }

  function isAuthorized(req: IncomingMessage): boolean {
    if (!token) return true;
    const auth = req.headers['authorization'];
    return auth === `Bearer ${token}`;
  }

  const dashboardHTML = buildDashboardHTML();

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    if (path === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(':ok\n\n');
      sseClients.add(res);
      for (const payload of payloads.values()) {
        res.write(`event: scan-complete\ndata: ${JSON.stringify(payload)}\n\n`);
      }
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (path === '/api/projects') {
      const failOn = (config.qualityGate?.failOn ?? 'critical') as Severity;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        localProject: localProject.key,
        projects: listProjects(db, failOn),
      }));
      return;
    }

    if (path === '/api/results') {
      const projectKey = url.searchParams.get('project') ?? localProject.key;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payloads.get(projectKey) ?? null));
      return;
    }

    if (path === '/api/rescan' && req.method === 'POST') {
      runScan().catch(console.error);
      res.writeHead(202);
      res.end('{}');
      return;
    }

    if (path === '/api/scan-ingest' && req.method === 'POST') {
      if (!isAuthorized(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      try {
        const body = await readBody(req);
        const { files, project } = JSON.parse(body) as { files: FileScanResult[]; project?: string };
        const payload = ingestScan(project || 'default', files);
        broadcast('scan-complete', payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    if (path === '/api/review' && req.method === 'POST') {
      try {
        const body = await readBody(req);
        const { findingId, decision, reviewer, note } = JSON.parse(body) as {
          findingId: number;
          decision: ReviewDecision;
          reviewer: string;
          note?: string;
        };
        const review = insertReview(db, findingId, decision, reviewer ?? 'dashboard', note);
        broadcast('review', { findingId, decision });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(review));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    if (path === '/api/reviews') {
      if (!isAuthorized(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const projectKey = url.searchParams.get('project');
      let projectId: number | undefined;
      if (projectKey) {
        const row = db.prepare(`SELECT id FROM projects WHERE key=?`).get(projectKey) as { id: number } | undefined;
        projectId = row?.id;
        if (projectId === undefined) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('[]');
          return;
        }
      }
      const reviews = getAllReviews(db, projectId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reviews));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(dashboardHTML);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`\nSkillScan v0.7.0`);
    console.log(`Dashboard: http://localhost:${port}`);
    console.log(`Database:  ${dbPath}`);
    console.log(`Project:   ${localProject.key}`);
    console.log(`Watching:  ${config.paths.join(', ')}`);
    if (token) console.log(`Auth:      token required`);
    console.log(`Press Ctrl+C to stop.\n`);
  });

  const watchPaths = config.paths.map((p) => resolve(cwd, p));
  for (const watchPath of watchPaths) {
    try {
      watch(watchPath, { recursive: true }, (_event, filename) => {
        if (!filename) return;
        if (!/\.(md|txt|yml|yaml)$/.test(filename)) return;
        console.log(`Changed: ${filename} — rescanning…`);
        runScan().catch(console.error);
      });
    } catch {
      // path doesn't exist yet
    }
  }

  await runScan();
}
