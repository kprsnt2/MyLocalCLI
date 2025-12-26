---
name: go
description: Best practices for Go development including idiomatic patterns, concurrency, and error handling.
globs: ["**/*.go", "**/go.mod", "**/go.sum"]
priority: 90
tags: ["language"]
---

# Go Best Practices

## Code Style
- Use gofmt for formatting
- Follow Effective Go guidelines
- Use short variable names in small scopes
- PascalCase for exported, camelCase for unexported

## Error Handling
- Always check errors
- Return errors, don't panic
- Wrap errors with context: fmt.Errorf("context: %w", err)
- Use errors.Is/As for error checking
- Define sentinel errors with errors.New

## Concurrency
- Don't communicate by sharing memory
- Share memory by communicating (channels)
- Use context for cancellation
- sync.WaitGroup for goroutine coordination
- Use select for multiple channel operations

## Patterns
- Accept interfaces, return structs
- Make zero values useful
- Use embedding for composition
- Table-driven tests

## Performance
- Use sync.Pool for object reuse
- Profile with pprof
- Use buffered channels when appropriate
- Avoid premature optimization
