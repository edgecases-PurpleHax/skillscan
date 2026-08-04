export function buildDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="auto">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SkillScan</title>
<style>
:root {
  --bg: #0f1117;
  --surface: #1a1d27;
  --surface2: #222636;
  --border: #2e3347;
  --text: #e2e8f0;
  --text-muted: #64748b;
  --text-dim: #94a3b8;
  --accent: #6366f1;
  --accent-glow: rgba(99,102,241,.15);
  --pass: #22c55e;
  --fail: #ef4444;
  --blocker: #dc2626;
  --blocker-bg: rgba(220,38,38,.12);
  --critical: #f97316;
  --critical-bg: rgba(249,115,22,.12);
  --major: #eab308;
  --major-bg: rgba(234,179,8,.12);
  --minor: #3b82f6;
  --minor-bg: rgba(59,130,246,.12);
  --info: #06b6d4;
  --info-bg: rgba(6,182,212,.12);
  --radius: 8px;
  --radius-sm: 5px;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #f8fafc;
    --surface: #ffffff;
    --surface2: #f1f5f9;
    --border: #e2e8f0;
    --text: #0f172a;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --blocker-bg: rgba(220,38,38,.07);
    --critical-bg: rgba(249,115,22,.07);
    --major-bg: rgba(234,179,8,.07);
    --minor-bg: rgba(59,130,246,.07);
    --info-bg: rgba(6,182,212,.07);
  }
}
:root[data-theme="light"] {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface2: #f1f5f9;
  --border: #e2e8f0;
  --text: #0f172a;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; font-size: 14px; }

/* ── Header ── */
.header {
  position: sticky; top: 0; z-index: 100;
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 0 24px; height: 56px;
  display: flex; align-items: center; gap: 16px;
}
.logo { font-size: 16px; font-weight: 800; letter-spacing: -.5px; color: var(--text); display: flex; align-items: center; gap: 8px; }
.logo svg { color: var(--accent); }
.gate-badge {
  padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
  letter-spacing: .05em; text-transform: uppercase;
}
.gate-badge.pass { background: rgba(34,197,94,.15); color: var(--pass); }
.gate-badge.fail { background: rgba(239,68,68,.15); color: var(--fail); }
.header-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.scan-time { font-size: 12px; color: var(--text-muted); }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--pass); animation: pulse 2s infinite; }
.live-dot.stale { background: var(--text-muted); animation: none; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.btn {
  padding: 6px 14px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600;
  cursor: pointer; border: 1px solid var(--border); background: var(--surface2);
  color: var(--text); transition: background .15s;
}
.btn:hover { background: var(--border); }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { opacity: .88; }
.theme-toggle { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 16px; padding: 4px; }

/* ── Summary bar ── */
.summary-bar {
  display: flex; gap: 12px; padding: 16px 24px;
  border-bottom: 1px solid var(--border); background: var(--surface);
  flex-wrap: wrap;
}
.sev-card {
  flex: 1; min-width: 90px; padding: 12px 16px; border-radius: var(--radius);
  background: var(--surface2); border: 1px solid var(--border);
  cursor: pointer; transition: border-color .15s, box-shadow .15s; user-select: none;
}
.sev-card:hover, .sev-card.active { border-color: var(--c); box-shadow: 0 0 0 1px var(--c); }
.sev-card .count { font-size: 26px; font-weight: 800; color: var(--c); line-height: 1; }
.sev-card .label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }
.sev-card[data-sev="blocker"] { --c: var(--blocker); }
.sev-card[data-sev="critical"] { --c: var(--critical); }
.sev-card[data-sev="major"] { --c: var(--major); }
.sev-card[data-sev="minor"] { --c: var(--minor); }
.sev-card[data-sev="info"] { --c: var(--info); }
.sev-card[data-sev="all"] { --c: var(--accent); }

/* ── Layout ── */
.layout { display: flex; height: calc(100vh - 56px - 77px); }
.sidebar {
  width: 260px; min-width: 200px; max-width: 320px;
  border-right: 1px solid var(--border); overflow-y: auto;
  background: var(--surface); resize: horizontal;
}
.sidebar-header { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
.file-item {
  padding: 8px 16px; cursor: pointer; border-left: 3px solid transparent;
  transition: background .1s; display: flex; align-items: center; justify-content: space-between;
}
.file-item:hover { background: var(--surface2); }
.file-item.active { background: var(--accent-glow); border-left-color: var(--accent); }
.file-item .file-name { font-size: 12px; color: var(--text-dim); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-item .file-count { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: var(--surface2); color: var(--text-muted); flex-shrink: 0; }
.file-item.has-findings .file-name { color: var(--text); }
.file-item.has-findings .file-count { background: var(--fail); color: #fff; }
.all-files-item { border-bottom: 1px solid var(--border); margin-bottom: 4px; }

/* ── Main panel ── */
.main { flex: 1; overflow-y: auto; padding: 20px 24px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.filter-bar input {
  flex: 1; min-width: 160px; padding: 7px 12px; border-radius: var(--radius-sm);
  border: 1px solid var(--border); background: var(--surface2); color: var(--text);
  font-size: 13px; outline: none;
}
.filter-bar input:focus { border-color: var(--accent); }
.cat-filter {
  padding: 5px 10px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 600;
  border: 1px solid var(--border); background: var(--surface2); color: var(--text-muted);
  cursor: pointer; text-transform: uppercase; letter-spacing: .04em;
}
.cat-filter.active { border-color: var(--accent); background: var(--accent-glow); color: var(--accent); }

.findings-list { display: flex; flex-direction: column; gap: 8px; }
.finding-card {
  border-radius: var(--radius); border: 1px solid var(--border);
  background: var(--surface); overflow: hidden; transition: border-color .15s;
  cursor: pointer;
}
.finding-card:hover { border-color: var(--c); }
.finding-header {
  padding: 10px 14px; display: flex; align-items: center; gap: 10px;
  background: var(--cb);
}
.finding-card[data-sev="blocker"] { --c: var(--blocker); --cb: var(--blocker-bg); }
.finding-card[data-sev="critical"] { --c: var(--critical); --cb: var(--critical-bg); }
.finding-card[data-sev="major"] { --c: var(--major); --cb: var(--major-bg); }
.finding-card[data-sev="minor"] { --c: var(--minor); --cb: var(--minor-bg); }
.finding-card[data-sev="info"] { --c: var(--info); --cb: var(--info-bg); }
.sev-badge {
  padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .06em; color: var(--c);
  border: 1px solid var(--c); flex-shrink: 0;
}
.rule-id { font-size: 11px; font-family: monospace; color: var(--text-muted); }
.rule-name { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; }
.finding-loc { font-size: 11px; color: var(--text-muted); font-family: monospace; flex-shrink: 0; }
.finding-body { padding: 10px 14px; border-top: 1px solid var(--border); display: none; }
.finding-body.open { display: block; }
.finding-message { font-size: 13px; color: var(--text); margin-bottom: 8px; }
.finding-snippet {
  font-family: monospace; font-size: 12px; background: var(--surface2);
  border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 8px;
  overflow-x: auto; white-space: pre; color: var(--text-dim);
  border-left: 3px solid var(--c);
}
.finding-fix { font-size: 12px; color: var(--text-dim); }
.finding-fix strong { color: var(--text-muted); }

.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.empty-state .icon { font-size: 48px; margin-bottom: 12px; }
.empty-state h3 { font-size: 18px; color: var(--text); margin-bottom: 6px; }

/* ── Rules panel ── */
.rules-panel { display: none; }
.rules-panel.open { display: block; }
.rules-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rules-table th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
.rules-table td { padding: 9px 12px; border-bottom: 1px solid var(--border); }
.rules-table tr:hover td { background: var(--surface2); }

/* ── Footer tabs ── */
.tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); background: var(--surface); padding: 0 24px; }
.tab { padding: 10px 14px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; transition: color .15s; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>

<div class="header">
  <div class="logo">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
    SkillScan
  </div>
  <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(99,102,241,.15);color:var(--accent);letter-spacing:.05em;text-transform:uppercase;">v0.1 Early Access</span>
  <div id="gate-badge" class="gate-badge">Scanning…</div>
  <div class="header-right">
    <div class="live-dot" id="live-dot" title="Live updates active"></div>
    <span class="scan-time" id="scan-time"></span>
    <button class="btn btn-primary" onclick="rescan()" id="rescan-btn">Rescan</button>
    <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">◐</button>
  </div>
</div>

<div class="summary-bar" id="summary-bar">
  <div class="sev-card" data-sev="all" onclick="filterSev('all')">
    <div class="count" id="count-all">—</div>
    <div class="label">All findings</div>
  </div>
  <div class="sev-card" data-sev="blocker" onclick="filterSev('blocker')">
    <div class="count" id="count-blocker">—</div>
    <div class="label">Blocker</div>
  </div>
  <div class="sev-card" data-sev="critical" onclick="filterSev('critical')">
    <div class="count" id="count-critical">—</div>
    <div class="label">Critical</div>
  </div>
  <div class="sev-card" data-sev="major" onclick="filterSev('major')">
    <div class="count" id="count-major">—</div>
    <div class="label">Major</div>
  </div>
  <div class="sev-card" data-sev="minor" onclick="filterSev('minor')">
    <div class="count" id="count-minor">—</div>
    <div class="label">Minor</div>
  </div>
  <div class="sev-card" data-sev="info" onclick="filterSev('info')">
    <div class="count" id="count-info">—</div>
    <div class="label">Info</div>
  </div>
</div>

<div class="tabs">
  <div class="tab active" id="tab-findings" onclick="switchTab('findings')">Findings</div>
  <div class="tab" id="tab-rules" onclick="switchTab('rules')">Rules Catalog</div>
</div>

<div class="layout" id="panel-findings">
  <div class="sidebar">
    <div class="sidebar-header">Files</div>
    <div id="file-list"></div>
  </div>
  <div class="main">
    <div class="filter-bar">
      <input type="text" id="search" placeholder="Search findings…" oninput="applyFilters()">
      <button class="cat-filter active" data-cat="all" onclick="filterCat(this,'all')">All</button>
      <button class="cat-filter" data-cat="injection" onclick="filterCat(this,'injection')">Injection</button>
      <button class="cat-filter" data-cat="exfiltration" onclick="filterCat(this,'exfiltration')">Exfiltration</button>
      <button class="cat-filter" data-cat="tool-abuse" onclick="filterCat(this,'tool-abuse')">Tool Abuse</button>
      <button class="cat-filter" data-cat="social-engineering" onclick="filterCat(this,'social-engineering')">Social Eng.</button>
      <button class="cat-filter" data-cat="obfuscation" onclick="filterCat(this,'obfuscation')">Obfuscation</button>
      <button class="cat-filter" data-cat="permission-escalation" onclick="filterCat(this,'permission-escalation')">Permissions</button>
    </div>
    <div id="findings-list" class="findings-list"></div>
  </div>
</div>

<div class="main rules-panel" id="panel-rules" style="height:calc(100vh - 56px - 77px - 41px); overflow-y:auto;">
  <div id="rules-table-container"></div>
</div>

<script>
let currentResults = null;
let selectedFile = 'all';
let selectedSev = 'all';
let selectedCat = 'all';
let scanning = false;

// ── Data fetching ──
async function fetchResults() {
  const r = await fetch('/api/results');
  if (!r.ok) return null;
  return r.json();
}

async function rescan() {
  if (scanning) return;
  scanning = true;
  document.getElementById('rescan-btn').innerHTML = '<span class="spinner"></span>';
  await fetch('/api/rescan', { method: 'POST' });
}

// ── SSE ──
function connectSSE() {
  const es = new EventSource('/events');
  es.addEventListener('scan-complete', (e) => {
    currentResults = JSON.parse(e.data);
    scanning = false;
    document.getElementById('rescan-btn').textContent = 'Rescan';
    render();
  });
  es.addEventListener('scanning', () => {
    scanning = true;
    document.getElementById('rescan-btn').innerHTML = '<span class="spinner"></span>';
    const badge = document.getElementById('gate-badge');
    badge.textContent = 'Scanning...';
    badge.className = 'gate-badge';
    badge.style.background = 'rgba(99,102,241,.15)';
    badge.style.color = 'var(--accent)';
  });
  es.onerror = () => {
    document.getElementById('live-dot').classList.add('stale');
    document.getElementById('live-dot').title = 'Live connection lost — refresh to reconnect';
    setTimeout(connectSSE, 3000);
  };
  es.onopen = () => {
    document.getElementById('live-dot').classList.remove('stale');
    document.getElementById('live-dot').title = 'Live updates active';
  };
}

// ── Render ──
function render() {
  if (!currentResults) return;
  const r = currentResults;

  // Gate badge
  const badge = document.getElementById('gate-badge');
  badge.textContent = r.passed ? '✔ Passed' : '✖ Failed';
  badge.className = 'gate-badge ' + (r.passed ? 'pass' : 'fail');

  // Scan time
  document.getElementById('scan-time').textContent =
    'Scanned ' + new Date(r.timestamp).toLocaleTimeString() + ' · ' + r.durationMs + 'ms';

  // Summary counts
  document.getElementById('count-all').textContent = r.totalFindings;
  ['blocker','critical','major','minor','info'].forEach(s => {
    document.getElementById('count-' + s).textContent = r.bySeverity[s] ?? 0;
  });

  renderFiles();
  renderFindings();
  renderRules();
}

function renderFiles() {
  const r = currentResults;
  const container = document.getElementById('file-list');
  let html = \`<div class="file-item all-files-item \${selectedFile==='all'?'active':''}" data-path="all" onclick="selectFile(this.dataset.path)">
    <span class="file-name">All files</span>
    <span class="file-count">\${r.totalFindings}</span>
  </div>\`;
  for (const f of r.files) {
    const name = f.filePath.replace(/\\\\/g,'/').split('/').slice(-2).join('/');
    const active = selectedFile === f.filePath ? 'active' : '';
    const hasF = f.findings.length > 0 ? 'has-findings' : '';
    html += \`<div class="file-item \${active} \${hasF}" data-path="\${esc(f.filePath)}" onclick="selectFile(this.dataset.path)">
      <span class="file-name" title="\${esc(f.filePath)}">\${esc(name)}</span>
      <span class="file-count">\${f.findings.length}</span>
    </div>\`;
  }
  container.innerHTML = html;
}

function renderFindings() {
  const r = currentResults;
  const search = document.getElementById('search').value.toLowerCase();
  const container = document.getElementById('findings-list');

  const findings = r.files
    .filter(f => selectedFile === 'all' || f.filePath === selectedFile)
    .flatMap(f => f.findings.map(fi => ({ ...fi, _file: f.filePath })))
    .filter(fi => selectedSev === 'all' || fi.severity === selectedSev)
    .filter(fi => selectedCat === 'all' || fi.category === selectedCat)
    .filter(fi => !search ||
      fi.message.toLowerCase().includes(search) ||
      fi.ruleId.toLowerCase().includes(search) ||
      fi.ruleName.toLowerCase().includes(search) ||
      (fi.snippet||'').toLowerCase().includes(search)
    );

  if (findings.length === 0) {
    container.innerHTML = \`<div class="empty-state">
      <div class="icon">\${r.totalFindings === 0 ? '🛡️' : '🔍'}</div>
      <h3>\${r.totalFindings === 0 ? 'No issues found' : 'No matches'}</h3>
      <p>\${r.totalFindings === 0 ? 'All scanned skill files are clean.' : 'Try adjusting your filters.'}</p>
    </div>\`;
    return;
  }

  container.innerHTML = findings.map((fi, i) => {
    const fileName = fi._file.replace(/\\\\/g,'/').split('/').slice(-2).join('/');
    const loc = fi.line ? \`\${fileName}:\${fi.line}\` : fileName;
    return \`<div class="finding-card" data-sev="\${fi.severity}" data-i="\${i}" onclick="toggleFinding(this)">
      <div class="finding-header">
        <span class="sev-badge">\${fi.severity}</span>
        <span class="rule-id">\${esc(fi.ruleId)}</span>
        <span class="rule-name">\${esc(fi.ruleName)}</span>
        <span class="finding-loc">\${esc(loc)}</span>
      </div>
      <div class="finding-body" id="fb-\${i}">
        <div class="finding-message">\${esc(fi.message)}</div>
        \${fi.snippet ? \`<div class="finding-snippet">\${esc(fi.snippet)}</div>\` : ''}
        <div class="finding-fix"><strong>Fix:</strong> \${esc(fi.remediation)}</div>
      </div>
    </div>\`;
  }).join('');
}

function renderRules() {
  const r = currentResults;
  if (!r.rules) return;
  const container = document.getElementById('rules-table-container');
  const byCategory = {};
  for (const rule of r.rules) {
    (byCategory[rule.category] = byCategory[rule.category] || []).push(rule);
  }
  let html = '';
  for (const [cat, rules] of Object.entries(byCategory)) {
    html += \`<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin:20px 0 8px;">\${cat}</h3>
    <table class="rules-table">
      <thead><tr><th>ID</th><th>Rule</th><th>Severity</th><th>Description</th><th>LLM</th></tr></thead>
      <tbody>\${rules.map(r => \`<tr>
        <td><code style="font-size:11px">\${esc(r.id)}</code></td>
        <td>\${esc(r.name)}</td>
        <td><span class="sev-badge" style="--c:var(--\${r.severity})">\${r.severity}</span></td>
        <td style="color:var(--text-dim);font-size:12px">\${esc(r.description)}</td>
        <td>\${r.requiresLLM ? '✓' : ''}</td>
      </tr>\`).join('')}</tbody>
    </table>\`;
  }
  container.innerHTML = html || '<p style="color:var(--text-muted);padding:20px 0">No rule data available.</p>';
}

// ── Interactions ──
function toggleFinding(card) {
  const i = card.dataset.i;
  const body = document.getElementById('fb-' + i);
  body.classList.toggle('open');
}

function selectFile(path) {
  selectedFile = path;
  renderFiles();
  renderFindings();
}

function filterSev(sev) {
  selectedSev = sev;
  document.querySelectorAll('.sev-card').forEach(c => c.classList.toggle('active', c.dataset.sev === sev));
  renderFindings();
}

function filterCat(el, cat) {
  selectedCat = cat;
  document.querySelectorAll('.cat-filter').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
  renderFindings();
}

function applyFilters() { renderFindings(); }

function switchTab(tab) {
  document.getElementById('panel-findings').style.display = tab === 'findings' ? 'flex' : 'none';
  document.getElementById('panel-rules').style.display = tab === 'rules' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + tab));
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.dataset.theme;
  if (current === 'dark') root.dataset.theme = 'light';
  else if (current === 'light') root.dataset.theme = 'dark';
  else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = isDark ? 'light' : 'dark';
  }
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──
(async () => {
  connectSSE();
  currentResults = await fetchResults();
  if (currentResults) {
    render();
  } else {
    const badge = document.getElementById('gate-badge');
    badge.textContent = 'Scanning...';
    badge.className = 'gate-badge';
    badge.style.background = 'rgba(99,102,241,.15)';
    badge.style.color = 'var(--accent)';
    document.getElementById('findings-list').innerHTML =
      \`<div class="empty-state"><div class="icon" style="font-size:32px"><span class="spinner" style="width:32px;height:32px;border-width:3px"></span></div><h3 style="margin-top:16px">Running initial scan...</h3><p>LLM enrichment may take up to 30 seconds.</p></div>\`;
  }
})();
</script>
</body>
</html>`;
}
