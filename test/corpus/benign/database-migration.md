# Database Migration

Guides authoring, running, and rolling back database migrations safely.

## Writing a Migration

Create a new migration file using the migration tool:

```bash
npx knex migrate:make add_user_preferences
```

This generates a timestamped file in `migrations/`. Edit it to define the `up` and `down` functions:

```ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.jsonb("preferences").notNullable().defaultTo("{}");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("preferences");
  });
}
```

Always implement the `down` function — it is required for rollback.

## Running Migrations

Apply all pending migrations:

```bash
npx knex migrate:latest
```

Check migration status at any time:

```bash
npx knex migrate:list
```

## Rolling Back

If a migration causes a problem, use the migration tool's built-in rollback command:

```bash
npx knex migrate:rollback
```

This reverts the most recently applied batch. Do not attempt to undo migrations by manually editing database schema or rewriting migration history.

## Verifying Data Integrity

After running a migration, confirm:
- The schema change is present: check column types and constraints in your database client.
- Existing rows are not corrupted: run a COUNT and spot-check a sample of rows.
- Application queries that touch the modified table still return expected results.

## Guidelines

- Migrations must be idempotent where possible.
- Never alter or delete a migration file that has already been applied to production.
- Destructive schema changes (dropping columns, changing types) require a multi-step migration: first deprecate, then remove in a later release.
- Test migrations against a copy of the production database before applying to production.
