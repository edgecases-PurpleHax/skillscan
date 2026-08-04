# API Development

Guides designing and implementing REST API endpoints.

## Endpoint Design

- Name resources with nouns, not verbs: `/users`, `/orders` — not `/getUsers`.
- Use HTTP methods correctly: GET retrieves, POST creates, PUT replaces, PATCH updates, DELETE removes.
- Return the appropriate status code: 200 for success, 201 for resource creation, 400 for client errors, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 500 for server errors.

## Input Validation

Validate all incoming request bodies before processing:

```ts
const result = schema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: result.error.format() });
}
```

Never trust client-supplied data. Validate types, lengths, and allowed values at the boundary.

## Error Response Format

Use a consistent error shape across all endpoints:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body is invalid.",
    "details": []
  }
}
```

Never expose stack traces, internal service names, or query strings in error responses.

## Authentication

- Load the API key from environment variables at startup — do not hardcode credentials in source files.
- Retrieve credentials from the environment using your framework's configuration module.
- For JWT-based auth, verify the signature and expiration on every protected request.
- Reject requests with missing or malformed authorization headers before executing any business logic.

## Rate Limiting

Apply rate limiting at the API gateway or middleware layer. Return HTTP 429 with a `Retry-After` header when a client exceeds its quota.

## Versioning

Prefix all routes with a version segment: `/v1/users`. When introducing breaking changes, introduce a new version rather than modifying an existing one.

## Testing Endpoints

Write integration tests that cover:
- Valid input returning the expected response
- Invalid input returning a 400 with a meaningful error
- Unauthenticated requests returning 401
- Requests for resources the caller does not own returning 403
