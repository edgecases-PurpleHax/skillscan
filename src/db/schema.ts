import Database from 'better-sqlite3';

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT    NOT NULL,
      paths     TEXT    NOT NULL,
      config_json TEXT  NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
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
      file_path       TEXT    NOT NULL UNIQUE,
      current_hash    TEXT    NOT NULL,
      last_scan_id    INTEGER REFERENCES scans(id),
      review_coverage REAL    NOT NULL DEFAULT 0
    );
  `);

  return db;
}
