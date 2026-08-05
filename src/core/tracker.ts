import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { FileScanResult, TrackingAlert } from '../types.js';

const LOCK_FILE = '.skillscan-lock.json';
const SPIKE_THRESHOLD = 20;

interface TrackedFile {
  hash: string;
  lastScan: string;
  findingCount: number;
  maxConfidence: number;
  wasClean: boolean;
}

interface LockFile {
  version: number;
  updated: string;
  files: Record<string, TrackedFile>;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

function loadLock(cwd: string): LockFile | null {
  const path = resolve(cwd, LOCK_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as LockFile;
  } catch {
    return null;
  }
}

export function processTracking(
  fileResults: FileScanResult[],
  rawContents: Map<string, string>,
  cwd: string,
): { alerts: TrackingAlert[]; isBaseline: boolean } {
  const existing = loadLock(cwd);
  const isBaseline = existing === null;
  const lock: LockFile = existing ?? { version: 1, updated: '', files: {} };
  const alerts: TrackingAlert[] = [];
  const now = new Date().toISOString();

  for (const result of fileResults) {
    const raw = rawContents.get(result.filePath) ?? '';
    const hash = hashContent(raw);
    const prev = lock.files[result.filePath];

    const realFindings = result.findings.filter((f) => !f.isHotspot);
    const findingCount = realFindings.length;
    const maxConfidence = findingCount === 0
      ? 0
      : Math.max(...realFindings.map((f) => f.confidence ?? 100));
    const isClean = findingCount === 0;

    if (prev && !isBaseline) {
      const hashChanged = prev.hash !== hash;
      if (prev.wasClean && !isClean) {
        alerts.push({
          filePath: result.filePath,
          type: 'regression',
          message: hashChanged
            ? `File changed and new findings appeared — possible silent skill overwrite`
            : `New findings since last scan (${findingCount}) — rule updates may have triggered this`,
        });
      } else if (hashChanged && !isClean) {
        const spike = maxConfidence - prev.maxConfidence;
        if (spike >= SPIKE_THRESHOLD) {
          alerts.push({
            filePath: result.filePath,
            type: 'confidence-spike',
            message: `File changed: confidence spiked ${prev.maxConfidence}% → ${maxConfidence}%`,
          });
        } else {
          alerts.push({
            filePath: result.filePath,
            type: 'file-changed',
            message: `File modified since last scan (findings unchanged)`,
          });
        }
      } else if (hashChanged && isClean && prev.wasClean) {
        alerts.push({
          filePath: result.filePath,
          type: 'file-changed',
          message: `File modified since last scan (still clean)`,
        });
      }
    }

    lock.files[result.filePath] = { hash, lastScan: now, findingCount, maxConfidence, wasClean: isClean };
  }

  lock.updated = now;
  writeFileSync(resolve(cwd, LOCK_FILE), JSON.stringify(lock, null, 2) + '\n', 'utf-8');
  return { alerts, isBaseline };
}
