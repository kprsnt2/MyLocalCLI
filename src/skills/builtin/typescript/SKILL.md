---
name: typescript
description: TypeScript development patterns, type system mastery, and best practices.
globs: ["**/*.ts", "**/*.tsx", "**/tsconfig.json"]
priority: 95
tags: ["language"]
---

# TypeScript Best Practices

## Type System
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `unknown` over `any` — force type narrowing
- Use discriminated unions for state machines
- Use `as const` for literal types
- Use `satisfies` to validate without widening
- Use template literal types for string patterns
- Avoid type assertions (`as`) — use type guards instead

## Generics
- Use constraints: `<T extends BaseType>`
- Use `infer` in conditional types for extraction
- Use mapped types for transformations
- Use `Record<K, V>` for dictionaries
- Use `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`

## Error Handling
- Use Result/Either pattern: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`
- Use branded types for validation: `type Email = string & { __brand: 'Email' }`
- Use `never` for exhaustive checks
- Define error types explicitly

## Patterns
- Use zod/valibot for runtime validation
- Use barrel exports (index.ts) for modules
- Use path aliases in tsconfig
- Enable strict mode always
- Use `noUncheckedIndexedAccess` for safety
