import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync, watch } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';
import type { ScanConfig, ScanResult } from '../types.js';
import type { ReviewDecision } from '../types.js';
import { scan } from '../core/scanner.js';
import { ALL_RULES } from '../rules/registry.js';
import { buildDashboardHTML } from './dashboard.js';
import { initDb } from '../db/schema.js';
import {
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

interface ServeOptions {
  config: ScanConfig;
  cwd: string;
  port: number;
  dbPath: string;
}

interface ScanPayload {
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

export async function serve(opts: ServeOptions): Promise<void> {
  const { config, cwd, port, dbPath } = opts;

  const db: Database.Database = initDb(dbPath);
  let currentPayload: ScanPayload | null = null;
  const sseClients = new Set<ServerResponse>();

  function broadcast(event: string, data?: unknown) {
    const msg = data
      ? `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      : `event: ${event}\ndata: {}\n\n`;
    for (const res of sseClients) {
      try { res.write(msg); } catch { sseClients.delete(res); }
    }
  }

  async function runScan() {
    broadcast('scanning');
    try {
      const result = await scan(config, cwd);

      const scanId = upsertScan(db, config.paths, config);
      const dbFindings = upsertFindings(db, scanId, result.files);

      // Build lookup: "filePath:ruleId:line:snippetHash" → db id
      const idMap = new Map<string, number>();
      for (const dbf of dbFindings) {
        idMap.set(`${dbf.filePath}:${dbf.ruleId}:${dbf.line ?? 0}:${dbf.snippetHash}`, dbf.id);
      }

      // Per-file: detect hash change, invalidate stale reviews, update file record
      for (const fr of result.files) {
        const raw = readFileSync(fr.filePath, 'utf-8');
        const hash = fileHash(raw);
        const prev = getFileRecord(db, fr.filePath);
        if (prev && prev.currentHash !== hash) {
          invalidateFileReviews(db, fr.filePath);
        }
        const coverage = computeReviewCoverage(db, fr.filePath);
        upsertFile(db, fr.filePath, hash, scanId, coverage);
      }

      // Attach DB ids to findings so the dashboard can submit reviews
      const filesWithIds = result.files.map((fr) => ({
        ...fr,
        findings: fr.findings.map((f) => ({
          ...f,
          id: idMap.get(`${fr.filePath}:${f.ruleId}:${f.line ?? 0}:${snippetHash(f)}`),
        })),
      }));

      const nonHotspotCount = dbFindings.filter((d) => !d.isHotspot).length;
      const reviewedCount = dbFindings.filter((d) => !d.isHotspot && getLatestReview(db, d.id) !== null).length;

      currentPayload = {
        timestamp: new Date().toISOString(),
        durationMs: result.durationMs,
        totalFindings: result.totalFindings,
        bySeverity: result.bySeverity,
        passed: result.passed,
        qualityGateMessage: result.qualityGateMessage,
        unreviewedFindings: nonHotspotCount - reviewedCount,
        reviewCoverage: nonHotspotCount === 0 ? 1 : reviewedCount / nonHotspotCount,
        files: filesWithIds,
        rules: ALL_RULES.map((r) => ({
          id: r.id,
          name: r.name,
          severity: r.severity,
          category: r.category,
          description: r.description,
          requiresLLM: r.requiresLLM,
        })),
      };
      broadcast('scan-complete', currentPayload);
    } catch (err) {
      broadcast('scan-error', { message: String(err) });
    }
  }

  const dashboardHTML = buildDashboardHTML();

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';

    if (url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(':ok\n\n');
      sseClients.add(res);
      if (currentPayload) {
        res.write(`event: scan-complete\ndata: ${JSON.stringify(currentPayload)}\n\n`);
      }
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (url === '/api/results') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentPayload));
      return;
    }

    if (url === '/api/rescan' && req.method === 'POST') {
      runScan().catch(console.error);
      res.writeHead(202);
      res.end('{}');
      return;
    }

    if (url === '/api/review' && req.method === 'POST') {
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

    if (url === '/api/reviews') {
      const reviews = getAllReviews(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reviews));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(dashboardHTML);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`\nSkillScan v0.4.0`);
    console.log(`Dashboard: http://localhost:${port}`);
    console.log(`Database:  ${dbPath}`);
    console.log(`Watching:  ${config.paths.join(', ')}`);
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
