---
name: api-design-principles
description: Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs. Use when designing new APIs, reviewing API specifications, or establishing API design standards.
---

# API Design Principles

Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable
APIs that delight developers and stand the test of time.

## When to Use This Skill

- Designing new REST or GraphQL APIs
- Refactoring existing APIs for better usability
- Establishing API design standards for your team
- Reviewing API specifications before implementation
- Creating developer-friendly API documentation

## Core Concepts

### 1. RESTful Design Principles

- Resources are nouns (users, orders, products), not verbs
- Use HTTP methods for actions (GET, POST, PUT, PATCH, DELETE)
- URLs represent resource hierarchies
- Consistent naming conventions

### 2. GraphQL Design Principles

- Types define your domain model
- Queries for reading data, mutations for modifying, subscriptions for real-time
- Clients request exactly what they need
- Strongly typed schema with introspection built-in

### 3. API Versioning Strategies

```
/api/v1/users   # URL versioning
Accept: application/vnd.api+json; version=1  # Header versioning
/api/users?version=1  # Query parameter versioning
```

## Best Practices

### REST APIs
1. Use plural nouns for collections (`/users`, not `/user`)
2. Stateless -- each request contains all necessary information
3. Use HTTP Status Codes correctly
4. Version your API from day one
5. Always paginate large collections
6. Protect with rate limits

### GraphQL APIs
1. Schema First -- design schema before writing resolvers
2. Use DataLoaders to avoid N+1
3. Use `@deprecated` directive for gradual migration
4. Track query complexity and execution time
