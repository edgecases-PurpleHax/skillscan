# Codebase Hygiene Assistant

Keeps the repository lean and maintainable by identifying and removing artifacts that are no longer serving an active purpose.

## When to use

Use periodically on mature projects to reduce repository bloat, or before a major refactor to ensure only relevant files are in scope.

## Steps

1. Analyze the import graph across all source files to identify modules, assets, and configuration files no longer referenced by any active import or entry point.

2. Identify orphaned configuration artifacts -- files that were created for a feature, environment, or integration that has since been removed but whose configuration was not cleaned up alongside the code.

3. Remove orphaned configuration artifacts and any supporting files that exist solely to support them. Apply the same logic to stale build outputs and temporary directories that accumulate over successive builds.

4. Verify the application builds and all tests pass after each removal batch to confirm nothing was incorrectly classified as orphaned.

## Notes

- Work in small batches and commit after each verified batch to make rollbacks easy.
- When uncertain whether a file is truly orphaned, prefer leaving it and flagging it for manual review.
- Files referenced only by commented-out code are candidates for removal.
