---
name: architecture
description: Software architecture patterns, system design, and scalability principles.
globs: ["**/README.md", "**/ARCHITECTURE.md", "**/docs/**"]
priority: 70
tags: ["architecture"]
---

# Software Architecture

## Design Principles
- SOLID principles
- Separation of concerns
- Dependency inversion
- Composition over inheritance
- Program to interfaces, not implementations
- YAGNI — don't build what you don't need

## Common Patterns
- MVC / MVVM / MVP for UI layers
- Repository pattern for data access
- Service layer for business logic
- Factory pattern for object creation
- Observer/Event pattern for decoupling
- Strategy pattern for algorithm selection
- Middleware pattern for cross-cutting concerns

## API Design
- Use REST for CRUD, GraphQL for flexible queries
- Version your APIs (URL or header)
- Use pagination for lists
- Use proper HTTP status codes
- Implement rate limiting
- Document with OpenAPI/Swagger

## Scalability
- Horizontal scaling over vertical
- Use caching (Redis, CDN)
- Use message queues for async work
- Database read replicas
- Sharding for write-heavy workloads
- Use CDN for static assets

## System Design
- Start simple, scale when needed
- Use load balancers for distribution
- Design for failure (retries, circuit breakers)
- Use health checks and monitoring
- Implement graceful shutdown
