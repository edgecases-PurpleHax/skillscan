import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { watch } from 'fs';
import { resolve } from 'path';
import type { ScanConfig, ScanResult } from '../types.js';
import { scan } from '../core/scanner.js';
import { ALL_RULES } from '../rules/registry.js';
import { buildDashboardHTML } from './dashboard.js';

interface ServeOptions {
  config: ScanConfig;
  cwd: string;
  port: number;
}

interface ScanPayload {
  timestamp: string;
  durationMs: number;
  totalFindings: number;
  bySeverity: ScanResult['bySeverity'];
  passed: boolean;
  qualityGateMessage: string;
  files: ScanResult['files'];
  rules: Array<{ id: string; name: string; severity: string; category: string; description: string; requiresLLM: boolean }>;
}

export async function serve(opts: ServeOptions): Promise<void> {
  const { config, cwd, port } = opts;

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
      currentPayload = {
        timestamp: new Date().toISOString(),
        durationMs: result.durationMs,
        totalFindings: result.totalFindings,
        bySeverity: result.bySeverity,
        passed: result.passed,
        qualityGateMessage: result.qualityGateMessage,
        files: result.files,
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

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
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

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(dashboardHTML);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`\nSkillScan v0.1 Early Access`);
    console.log(`Dashboard: http://localhost:${port}`);
    console.log(`Watching:  ${config.paths.join(', ')}`);
    console.log(`Press Ctrl+C to stop.\n`);
  });

  // File watcher
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
      // path doesn't exist yet, skip watching
    }
  }

  await runScan();
}
