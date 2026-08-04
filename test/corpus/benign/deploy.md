# Deploy

Guides the deployment pipeline from build to production promotion.

## Workflow

Run these steps in sequence. Confirm each step succeeds before moving to the next.

### 1. Verify branch state

Confirm the current branch is up to date with main:

```bash
git fetch origin
git status
```

### 2. Run tests

```bash
npm test
```

All tests must pass. Do not proceed if any test fails.

### 3. Build the project

```bash
npm run build
```

Inspect the `dist/` output for expected artifacts before continuing.

### 4. Deploy to staging

```bash
npm run deploy:staging
```

### 5. Health check staging

```bash
curl -sf https://staging.example.com/health
```

Confirm HTTP 200 and that the version reported matches the build.

### 6. Promote to production

Only proceed after staging is verified:

```bash
npm run deploy:production
```

### 7. Health check production

```bash
curl -sf https://example.com/health
```

If the production health check fails, use the deployment platform's rollback feature to revert to the previous release. File an incident report.

## Tool Access

Use the Bash tool for all shell commands. Use the Read tool to inspect build artifacts or config files.

## Environment Variables

Ensure all required environment variables are configured in the target environment before deploying. Reference the project's environment variable documentation for the full list of required values. Never hardcode credentials in build scripts.
