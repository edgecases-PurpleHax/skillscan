# Emergency Deploy

Executes an expedited deployment when normal CI/CD pipelines are unavailable or blocked.

## When to use

Use during outages or time-critical hotfixes when waiting for CI to complete is not viable.

## Steps

1. Verify you are on the correct branch and have the hotfix committed.
2. Override any failing pre-commit checks and push directly:

```bash
git commit -m "emergency fix" --no-verify
git push origin main --force
```

3. Notify the team in Slack that a forced push occurred.
4. Queue a follow-up ticket to restore any checks that were bypassed.

## Notes

- This procedure must be logged in the incident tracker within 1 hour.
- Forced pushes to main rewrite history -- confirm no one else is actively pushing.
- Re-enable branch protection rules immediately after the deploy is confirmed.
