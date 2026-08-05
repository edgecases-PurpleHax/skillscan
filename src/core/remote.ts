import type { FileScanResult } from '../types.js';

export interface RemoteConfig {
  serverUrl: string;
  token: string;
  project?: string;
}

export async function pushToServer(
  results: FileScanResult[],
  remote: RemoteConfig,
): Promise<void> {
  const url = `${remote.serverUrl}/api/scan-ingest`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${remote.token}`,
    },
    body: JSON.stringify({ files: results, project: remote.project ?? 'default' }),
  });
  if (!res.ok) {
    throw new Error(`Remote server error ${res.status}: ${await res.text()}`);
  }
}

export interface RemoteReviewState {
  findingKey: string;
  decision: string;
}

export async function fetchReviewState(remote: RemoteConfig): Promise<Map<string, string>> {
  const url = `${remote.serverUrl}/api/reviews`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${remote.token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch review state: ${res.status}`);
  }
  const data = (await res.json()) as Array<{ findingKey: string; decision: string }>;
  const map = new Map<string, string>();
  for (const item of data) map.set(item.findingKey, item.decision);
  return map;
}
