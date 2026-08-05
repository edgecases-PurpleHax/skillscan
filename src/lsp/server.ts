import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  type InitializeParams,
  type InitializeResult,
  TextDocumentSyncKind,
  type Diagnostic,
  DiagnosticSeverity,
  type TextDocumentPositionParams,
  type Hover,
  MarkupKind,
  type TextDocumentChangeEvent,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Finding } from '../types.js';
import { ALL_RULES } from '../rules/registry.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

const STATIC_RULES = ALL_RULES.filter((r) => !r.requiresLLM);

// Per-document findings cache for hover lookups
const docFindings = new Map<string, Array<Finding & { filePath: string }>>();

function severityToDiag(sev: Finding['severity']): DiagnosticSeverity {
  switch (sev) {
    case 'blocker':
    case 'critical': return DiagnosticSeverity.Error;
    case 'major':    return DiagnosticSeverity.Warning;
    case 'minor':    return DiagnosticSeverity.Information;
    default:         return DiagnosticSeverity.Hint;
  }
}

function runStaticRules(doc: TextDocument): Finding[] {
  const raw = doc.getText();
  const lines = raw.split('\n');
  const filePath = fileURLToPath(doc.uri);
  const content = { filePath, raw, lines };
  const findings: Finding[] = [];
  for (const rule of STATIC_RULES) {
    try {
      findings.push(...rule.check(content));
    } catch {
      // rule errors are non-fatal
    }
  }
  return findings;
}

function findingsToDiagnostics(findings: Finding[], doc: TextDocument): Diagnostic[] {
  return findings.map((f) => {
    const lineIdx = f.line != null ? f.line - 1 : 0;
    const lineText = doc.getText({
      start: { line: lineIdx, character: 0 },
      end: { line: lineIdx, character: Number.MAX_SAFE_INTEGER },
    });
    return {
      severity: severityToDiag(f.severity),
      range: {
        start: { line: lineIdx, character: 0 },
        end: { line: lineIdx, character: lineText.length },
      },
      message: `[${f.ruleId}] ${f.message}`,
      source: 'SkillScan',
      code: f.ruleId,
      data: f,
    } satisfies Diagnostic;
  });
}

async function validateDocument(doc: TextDocument): Promise<void> {
  const findings = runStaticRules(doc);
  const filePath = fileURLToPath(doc.uri);
  docFindings.set(doc.uri, findings.map((f) => ({ ...f, filePath })));
  connection.sendDiagnostics({ uri: doc.uri, diagnostics: findingsToDiagnostics(findings, doc) });
}

async function validateWithLLM(doc: TextDocument): Promise<void> {
  const filePath = fileURLToPath(doc.uri);
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!['md', 'txt', 'yml', 'yaml'].includes(ext ?? '')) return;

  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return;

  const llmConfig: import('../types.js').LLMConfig = {
    provider: process.env.ANTHROPIC_API_KEY ? 'claude' : 'openai',
    apiKey,
  };

  try {
    const { runLLMAnalysis } = await import('../rules/llm/enrichment.js');
    const raw = doc.getText();
    const content = { filePath, raw, lines: raw.split('\n') };
    const llmFindings = await runLLMAnalysis(content, llmConfig);
    const existing = docFindings.get(doc.uri) ?? [];
    const merged = [...existing];
    for (const lf of llmFindings) {
      const dup = lf.line != null && existing.some(
        (sf) => sf.line != null && Math.abs(sf.line - lf.line!) <= 1 && sf.category === lf.category,
      );
      if (!dup) merged.push({ ...lf, filePath });
    }
    docFindings.set(doc.uri, merged);
    connection.sendDiagnostics({ uri: doc.uri, diagnostics: findingsToDiagnostics(merged, doc) });
  } catch {
    // LLM errors are non-fatal
  }
}

async function getReviewState(filePath: string, ruleId: string): Promise<string | null> {
  const cwd = process.cwd();
  const dbPath = join(cwd, '.skillscan.db');
  if (!existsSync(dbPath)) return null;
  try {
    const { default: Database } = await import('better-sqlite3');
    const db = new Database(dbPath, { readonly: true });
    const row = db.prepare(`
      SELECT r.decision, r.reviewer, r.timestamp
      FROM reviews r
      JOIN findings f ON f.id = r.finding_id
      WHERE f.file_path = ? AND f.rule_id = ?
      ORDER BY r.timestamp DESC LIMIT 1
    `).get(filePath, ruleId) as { decision: string; reviewer: string; timestamp: string } | undefined;
    db.close();
    if (!row) return null;
    return `reviewed by **${row.reviewer}** on ${new Date(row.timestamp).toLocaleDateString()} — *${row.decision}*`;
  } catch {
    return null;
  }
}

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: true,
    },
  };
});

connection.onHover(async (params: TextDocumentPositionParams): Promise<Hover | null> => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;
  const findings = docFindings.get(params.textDocument.uri) ?? [];
  const hoverLine = params.position.line + 1;
  const match = findings.find((f) => f.line != null && Math.abs(f.line - hoverLine) <= 1);
  if (!match) return null;

  const reviewLine = await getReviewState(match.filePath, match.ruleId);
  const lines = [
    `**[${match.ruleId}]** ${match.ruleName}`,
    '',
    match.message,
    '',
    `**Fix:** ${match.remediation}`,
    ...(reviewLine ? ['', `*${reviewLine}*`] : []),
  ];

  return {
    contents: { kind: MarkupKind.Markdown, value: lines.join('\n') },
  };
});

documents.onDidOpen((e: TextDocumentChangeEvent<TextDocument>) => { validateDocument(e.document).catch(() => {}); });
documents.onDidChangeContent((e: TextDocumentChangeEvent<TextDocument>) => { validateDocument(e.document).catch(() => {}); });
documents.onDidSave((e: TextDocumentChangeEvent<TextDocument>) => { validateWithLLM(e.document).catch(() => {}); });

export function startLsp(): void {
  documents.listen(connection);
  connection.listen();
}
