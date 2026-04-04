---
name: graphql
description: GraphQL API design, schema patterns, resolvers, and client usage.
globs: ["**/*.graphql", "**/*.gql", "**/apollo*", "**/schema.*"]
priority: 80
tags: ["framework"]
---

# GraphQL Best Practices

## Schema Design
- Use descriptive type names (User, not UserType)
- Use connections pattern for pagination (Relay-style)
- Use input types for mutations
- Use enums for fixed values
- Use interfaces/unions for polymorphism
- Keep schema as the source of truth

## Resolvers
- Keep resolvers thin — delegate to services
- Use DataLoader for N+1 prevention
- Return errors in the response, don't throw
- Use context for auth, dataloaders, services

## Performance
- Use persisted queries in production
- Implement query complexity analysis
- Set depth limits on queries
- Use `@defer` and `@stream` for large responses
- Cache at resolver level with DataLoader

## Security
- Disable introspection in production
- Validate input depth and complexity
- Use field-level authorization
- Rate limit by query complexity
