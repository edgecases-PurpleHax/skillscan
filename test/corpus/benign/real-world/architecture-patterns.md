---
name: architecture-patterns
description: Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design. Use when designing clean architecture for a new microservice, refactoring a monolith, or debugging dependency cycles.
---

# Architecture Patterns

## When to Use This Skill

- Designing new backend services from scratch
- Refactoring monolithic applications where business logic is entangled with ORM models
- Establishing bounded contexts before splitting a system into services
- Debugging dependency cycles where infrastructure code bleeds into the domain layer
- Creating testable codebases where use-case tests do not require a running database

## Core Concepts

### 1. Clean Architecture (Uncle Bob)

**Layers (dependency flows inward):**
- **Entities**: Core business models, no framework imports
- **Use Cases**: Application business rules, orchestrate entities
- **Interface Adapters**: Controllers, presenters, gateways
- **Frameworks and Drivers**: UI, database, external services

**Key Principles:**
- Dependencies point inward only
- Business logic independent of frameworks and databases
- Every layer boundary crossed via abstract interface

### 2. Hexagonal Architecture (Ports and Adapters)

- **Domain Core**: Business logic, framework-free
- **Ports**: Abstract interfaces (driving and driven)
- **Adapters**: Concrete implementations (PostgreSQL adapter, Stripe adapter, REST adapter)

Benefits: swap implementations without touching core; use in-memory adapters in tests.

### 3. DDD Tactical Patterns

- **Entities**: Objects with stable identity
- **Value Objects**: Immutable, identified by attributes (Email, Money, Address)
- **Aggregates**: Consistency boundaries
- **Repositories**: Persist and reconstitute aggregates
- **Domain Events**: Capture things that happened inside the domain

## Testing -- In-Memory Adapters

Correct Clean Architecture means every use case is exercisable in a plain unit test with no
real database, no Docker, and no network -- using in-memory repository implementations.
