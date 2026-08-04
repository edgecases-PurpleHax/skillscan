---
name: microservices-patterns
description: Design microservices architectures with service boundaries, event-driven communication, and resilience patterns. Use when building distributed systems, decomposing monoliths, or implementing microservices.
---

# Microservices Patterns

## When to Use This Skill

- Decomposing monoliths into microservices
- Designing service boundaries and contracts
- Implementing inter-service communication
- Managing distributed data and transactions
- Building resilient distributed systems

## Core Concepts

### 1. Service Decomposition Strategies

**By Business Capability** -- organize services around business functions (OrderService,
PaymentService, InventoryService)

**By Subdomain (DDD)** -- bounded contexts map to services

**Strangler Fig Pattern** -- gradually extract from monolith; proxy routes to old/new systems

### 2. Communication Patterns

**Synchronous:** REST APIs, gRPC, GraphQL
**Asynchronous:** Event streaming (Kafka), Message queues (RabbitMQ, SQS), Pub/Sub

### 3. Data Management

- **Database Per Service** -- each service owns its data, no shared databases
- **Saga Pattern** -- distributed transactions with compensating actions, eventual consistency

### 4. Resilience Patterns

- **Circuit Breaker** -- fail fast on repeated errors, prevent cascade failures
- **Retry with Backoff** -- transient fault handling, exponential backoff
- **Bulkhead** -- isolate resources, limit impact of failures
