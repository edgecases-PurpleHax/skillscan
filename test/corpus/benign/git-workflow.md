# Git Workflow

Describes the branching strategy, commit conventions, and PR process for this project.

## Branching Strategy

All work happens on feature branches created from `main`. Never commit directly to `main`.

Branch naming:

- Feature: `feat/<short-description>`
- Bug fix: `fix/<short-description>`
- Refactor: `refactor/<short-description>`
- Docs: `docs/<short-description>`

If a ticket ID is available, prefix the branch name with it:

```
feat/TR-142/add-user-export
```

## Creating a Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/TR-142/add-user-export
```

## Commit Message Conventions

Follow the Conventional Commits format:

```
<type>(<scope>): <short summary>

<optional body>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Keep the subject line under 72 characters. Use the body to explain *why* the change was made, not *what* changed.

## Keeping Your Branch Up to Date

Rebase onto main regularly to avoid large merge conflicts at PR time:

```bash
git fetch origin
git rebase origin/main
```

Resolve any conflicts during the rebase before pushing.

## Opening a Pull Request

Push your branch and open a PR against `main`:

```bash
git push -u origin feat/TR-142/add-user-export
```

PR descriptions must include:
- A short summary of what changed and why
- A test plan describing how to verify the change works
- Links to relevant tickets

## Review and Merge

Request at least one reviewer. Address all review comments before merging. Use squash-merge to keep the main branch history clean.
