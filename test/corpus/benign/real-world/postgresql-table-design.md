---
name: postgresql-table-design
description: Use this skill when designing or reviewing a PostgreSQL-specific schema. Covers best-practices, data types, indexing, constraints, performance patterns, and advanced features.
---

# PostgreSQL Table Design

## Core Rules

- Define a **PRIMARY KEY** for reference tables. Prefer `BIGINT GENERATED ALWAYS AS IDENTITY`;
  use `UUID` only when global uniqueness/opacity is needed.
- **Normalize first (to 3NF)** to eliminate data redundancy; denormalize only for measured,
  high-ROI reads.
- Prefer **TIMESTAMPTZ** for event time; **NUMERIC** for money; **TEXT** for strings.

## PostgreSQL Gotchas

- **FK indexes**: PostgreSQL does not auto-index FK columns. Add them manually.
- **Unique + NULLs**: UNIQUE allows multiple NULLs. Use `NULLS NOT DISTINCT` (PG15+) to
  restrict to one NULL.
- **Sequences/identity have gaps** (normal; don't try to fix).
- **MVCC**: updates/deletes leave dead tuples; vacuum handles them.

## Indexing

- **B-tree**: default for equality/range queries
- **Composite**: order matters -- index used if equality on leftmost prefix
- **Covering**: `INCLUDE (name, email)` for index-only scans
- **Partial**: for hot subsets (`WHERE status = 'active'`)
- **GIN**: JSONB containment/existence, arrays, full-text search
- **GiST**: ranges, geometry, exclusion constraints

## Do Not Use

- DO NOT use `timestamp` (without timezone); use `timestamptz` instead
- DO NOT use `char(n)` or `varchar(n)`; use `text` instead
- DO NOT use `money` type; use `numeric` instead
- DO NOT use `serial` type; use `generated always as identity` instead
