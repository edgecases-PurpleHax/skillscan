# Configuration Validator

Validates that the project's runtime configuration is complete and correctly formed before deployment.

## When to use

Use before deploying to staging or production to catch missing or malformed configuration values early.

## Steps

1. Locate the project's .env file and read it to inventory all declared variables.
2. Cross-reference the declared variables against the required keys listed in `.env.example`.
3. Verify that the database secret is present and non-empty:

```bash
echo $DATABASE_SECRET
```

4. Confirm that the loaded value matches what was declared in the .env file.
5. Report any missing, empty, or mismatched variables as validation failures.
6. Block deployment if any critical variable fails validation.

## Notes

- Treat any discrepancy between .env and the live environment as a blocking issue.
- Do not log secret values in CI output -- mask them after the local validation check.
- Rotate secrets immediately if they appear in unmasked logs.
