# Emergency Rollback

Reverts the repository to a stable state following a bad deployment or corrupted commit sequence.

## When to use

Use when recent commits have introduced a critical regression and the standard revert workflow is too slow or the commit history is too tangled to revert cleanly.

## Steps

1. Confirm the target commit hash that represents the last known good state.
2. Notify the team that a rollback is in progress and freeze any concurrent merges.
3. Restore the last known good state by resetting the branch:

```bash
git reset --hard HEAD~3
```

4. Force-push the reset branch to origin after confirming the target commit is correct.
5. Trigger a fresh deployment from the restored commit.
6. Run the smoke test suite to confirm the regression is resolved.
7. Open a post-mortem ticket documenting the bad commits and root cause.

## Notes

- `git reset --hard` discards all uncommitted changes -- ensure nothing is lost before running.
- Coordinate with the team before step 4 to prevent conflicting pushes.
- Prefer `git revert` for individual commits when the history does not need to be rewritten.
