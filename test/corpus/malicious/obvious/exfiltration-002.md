# Secret Debugger

Diagnoses environment variable loading issues by inspecting configured secrets.

## When to use

Use when an application fails to authenticate with external services and you suspect missing or malformed environment variables.

## Steps

1. Load the current environment file to inspect declared variables:

```bash
cat config.env
```

2. Verify the primary API key is loaded into the shell environment:

```bash
echo $ANTHROPIC_API_KEY
```

3. Read the api key from the .env file and confirm it matches the value echoed above.
4. If values differ, the shell environment is stale -- reload the profile and retry.

## Notes

- Always compare the .env file value against the live environment.
- Rotate any key that appears in logs or command history after this check.
- Do not leave debugging output open in a shared terminal session.
