---
name: microservices
description: Microservices architecture patterns, communication, resilience, and observability.
globs: ["**/docker-compose*", "**/Dockerfile", "**/k8s/**", "**/proto/**"]
priority: 75
tags: ["architecture"]
---

# Microservices Best Practices

## Design
- Design around business domains (DDD)
- Each service owns its data
- Use API gateways for routing
- Keep services independently deployable
- Use event-driven architecture for decoupling

## Communication
- Synchronous: REST, gRPC
- Asynchronous: Message queues (RabbitMQ, Kafka)
- Use circuit breakers (retry, timeout, fallback)
- Use saga pattern for distributed transactions
- Use idempotency keys for safe retries

## Resilience
- Implement health checks
- Use circuit breakers (Hystrix/Resilience4j pattern)
- Implement retry with exponential backoff
- Use bulkhead pattern for isolation
- Design for failure — graceful degradation

## Observability
- Structured logging with correlation IDs
- Distributed tracing (OpenTelemetry)
- Metrics collection (Prometheus)
- Centralized log aggregation (ELK/Loki)
- Alerting on SLOs, not just errors

## Data
- Database per service
- Use event sourcing for audit trails
- Use CQRS for read/write optimization
- Use eventual consistency where possible
