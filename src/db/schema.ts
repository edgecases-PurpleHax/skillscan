import Database from 'better-sqlite3';

const DEFAULT_PROJECT_KEY = 'default';

function tableHasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function tableExists(db: Database.Database, table: string): boolean {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
  return row !== undefined;
}

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key        TEXT    NOT NULL UNIQUE,
      name       TEXT    NOT NULL,
      created_at TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL DEFAULT 1 REFERENCES projects(id),
      timestamp   TEXT    NOT NULL,
      paths       TEXT    NOT NULL,
      config_json TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id   INTEGER NOT NULL DEFAULT 1 REFERENCES projects(id),
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
      UNIQUE(project_id, file_path, rule_id, line, snippet_hash)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id INTEGER NOT NULL REFERENCES findings(id),
      decision   TEXT    NOT NULL CHECK(decision IN ('accepted','false-positive','wont-fix')),
      reviewer   TEXT    NOT NULL,
      timestamp  TEXT    NOT NULL,
      note       TEXT
    );

    CREATE TABLE IF NOT EXISTS files (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id      INTEGER NOT NULL DEFAULT 1 REFERENCES projects(id),
      file_path       TEXT    NOT NULL,
      current_hash    TEXT    NOT NULL,
      last_scan_id    INTEGER REFERENCES scans(id),
      review_coverage REAL    NOT NULL DEFAULT 0,
      UNIQUE(project_id, file_path)
    );
  `);

  migrateToProjects(db);

  db.prepare(`
    INSERT OR IGNORE INTO projects (key, name, created_at) VALUES (?, ?, ?)
  `).run(DEFAULT_PROJECT_KEY, 'Default', new Date().toISOString());

  return db;
}

// Pre-0.7.0 databases have no project_id columns; rebuild those tables and
// attach all existing rows to the default project. Review ids are preserved.
function migrateToProjects(db: Database.Database): void {
  const needsMigration =
    tableExists(db, 'findings') && !tableHasColumn(db, 'findings', 'project_id');
  if (!needsMigration) return;

  db.pragma('foreign_keys = OFF');
  const migrate = db.transaction(() => {
    db.prepare(`
      INSERT OR IGNORE INTO projects (key, name, created_at) VALUES (?, ?, ?)
    `).run(DEFAULT_PROJECT_KEY, 'Default', new Date().toISOString());
    const projectId = (db.prepare(`SELECT id FROM projects WHERE key=?`).get(DEFAULT_PROJECT_KEY) as { id: number }).id;

    db.exec(`ALTER TABLE scans ADD COLUMN project_id INTEGER NOT NULL DEFAULT ${projectId}`);

    db.exec(`
      CREATE TABLE findings_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id   INTEGER NOT NULL DEFAULT 1 REFERENCES projects(id),
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
        UNIQUE(project_id, file_path, rule_id, line, snippet_hash)
      );
    `);
    db.exec(`
      INSERT INTO findings_new (id, project_id, scan_id, file_path, rule_id, line, snippet_hash, severity, category, message, remediation, confidence, is_hotspot)
      SELECT id, ${projectId}, scan_id, file_path, rule_id, line, snippet_hash, severity, category, message, remediation, confidence, is_hotspot FROM findings;
    `);
    db.exec(`DROP TABLE findings; ALTER TABLE findings_new RENAME TO findings;`);

    db.exec(`
      CREATE TABLE files_new (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id      INTEGER NOT NULL DEFAULT 1 REFERENCES projects(id),
        file_path       TEXT    NOT NULL,
        current_hash    TEXT    NOT NULL,
        last_scan_id    INTEGER REFERENCES scans(id),
        review_coverage REAL    NOT NULL DEFAULT 0,
        UNIQUE(project_id, file_path)
      );
    `);
    db.exec(`
      INSERT INTO files_new (id, project_id, file_path, current_hash, last_scan_id, review_coverage)
      SELECT id, ${projectId}, file_path, current_hash, last_scan_id, review_coverage FROM files;
    `);
    db.exec(`DROP TABLE files; ALTER TABLE files_new RENAME TO files;`);
  });
  migrate();
  db.pragma('foreign_keys = ON');
}
