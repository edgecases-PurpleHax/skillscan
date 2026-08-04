# Security Audit

A checklist for reviewing code changes for common security weaknesses.

## SQL Injection

Confirm all database queries use parameterized statements or a query builder that prevents direct string interpolation of untrusted input. Search for raw string concatenation in query construction:

```bash
grep -rn "query.*+" src/
```

Flag any instance where user-controlled data is concatenated into a query string.

## Cross-Site Scripting (XSS)

- Verify that user-supplied strings are always encoded before insertion into HTML.
- Check React components for `dangerouslySetInnerHTML` usage — each instance requires a comment explaining why it is safe.
- Confirm that Content-Security-Policy headers are set and do not include `unsafe-inline` without justification.

## Authentication and Authorization

- Every protected route must verify the session or token before returning data.
- Confirm that failed authentication attempts return a generic error message, not one that reveals whether the account exists.
- Check that authorization is enforced at the service layer, not only in the UI.

## Dependency Vulnerabilities

```bash
npm audit --audit-level=moderate
```

Review the output and address any `high` or `critical` severity findings before merging.

## Sensitive Data in Logs

Search for logging statements that may capture credentials or personal data:

```bash
grep -rn "console.log\|logger\." src/ | grep -i "password\|email"
```

Remove or mask any sensitive values before they reach log output.

## Credentials in Source Code

Confirm no credentials or API keys are hardcoded in source files. All credentials must be loaded from environment variables at runtime. Run a quick scan:

```bash
grep -rn "api_key\s*=\s*['\"]" src/
```

## HTTPS and Transport Security

- All external requests must use HTTPS endpoints.
- Confirm that TLS certificate validation is not disabled in HTTP client configuration.
