---
name: nodejs-backend-patterns
description: Build production-ready Node.js backend services with Express/Fastify, implementing middleware patterns, error handling, authentication, database integration, and API design best practices.
---

# Node.js Backend Patterns

## When to Use This Skill

- Building REST APIs or GraphQL servers
- Creating microservices with Node.js
- Implementing authentication and authorization
- Designing scalable backend architectures
- Setting up middleware and error handling
- Building real-time applications with WebSockets

## Best Practices

1. **Use TypeScript** -- type safety prevents runtime errors
2. **Implement proper error handling** -- use custom error classes
3. **Validate input** -- use libraries like Zod or Joi
4. **Use environment variables** -- never hardcode secrets
5. **Implement logging** -- use structured logging (Pino, Winston)
6. **Add rate limiting** -- prevent abuse
7. **Use HTTPS** -- always in production
8. **Implement CORS properly** -- don't use `*` in production
9. **Use dependency injection** -- easier testing and maintenance
10. **Write tests** -- unit, integration, and E2E tests
11. **Handle graceful shutdown** -- clean up resources
12. **Use connection pooling** -- for databases
13. **Implement health checks** -- for monitoring
14. **Use compression** -- reduce response size
15. **Monitor performance** -- use APM tools
