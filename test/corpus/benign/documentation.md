# Documentation

Guides writing inline code documentation and keeping reference docs up to date.

## JSDoc / TSDoc Comments

Add documentation comments to all exported functions, classes, and types.

Minimal JSDoc block:

```ts
/**
 * Parses a raw date string into a UTC Date object.
 *
 * @param raw - ISO 8601 date string from the API response
 * @returns UTC Date, or null if the string cannot be parsed
 */
export function parseDate(raw: string): Date | null { ... }
```

Rules:
- Document *why* a parameter has constraints, not just what type it is.
- Include an `@example` block for non-obvious functions.
- Mark deprecated exports with `@deprecated` and a migration note.

## Generating API Reference

Run the documentation generator after updating exported types:

```bash
npm run docs:generate
```

Output is written to `docs/api/`. Commit this output alongside the source changes.

## README Sections

The README should contain:

1. Project purpose (one paragraph)
2. Prerequisites and installation steps
3. How to run the project locally
4. How to run tests
5. How to contribute
6. License

When adding a new feature that changes the public interface or setup process, update the relevant README section in the same PR.

## Keeping Docs in Sync

Before marking a PR ready for review, verify:
- All modified exported symbols have up-to-date doc comments.
- The README reflects any changes to setup or usage.
- The changelog entry (if the project maintains one) is accurate.

## Diagrams

Use Mermaid syntax for architecture and flow diagrams embedded in Markdown. Keep diagrams close to the code they describe.
