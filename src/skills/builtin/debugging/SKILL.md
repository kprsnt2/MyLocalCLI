---
name: debugging
description: Systematic debugging techniques, profiling, and troubleshooting patterns.
globs: ["**/*.js", "**/*.ts", "**/*.py", "**/*.java", "**/*.go", "**/*.rs"]
alwaysApply: ["**/debug*", "**/error*"]
priority: 90
tags: ["workflow"]
---

# Debugging Best Practices

## Systematic Approach
1. Reproduce the issue consistently
2. Isolate the problem (binary search)
3. Form a hypothesis
4. Test the hypothesis
5. Fix and verify the fix doesn't break anything

## JavaScript/Node.js
- Use `debugger` statement + Chrome DevTools
- Use `node --inspect` for Node.js debugging
- Use `console.trace()` for call stacks
- Use `console.table()` for arrays/objects
- Check network tab for API issues

## Common Issues
- Off-by-one errors in loops
- Null/undefined access (use optional chaining)
- Async race conditions (use proper awaiting)
- Memory leaks (check event listeners, closures)
- Circular dependencies (check import order)

## Performance Debugging
- Use browser Performance tab
- Use `console.time()` / `console.timeEnd()`
- Profile memory with heap snapshots
- Check for unnecessary re-renders (React Profiler)
- Use flame graphs for CPU profiling

## Error Handling
- Always log the full error stack
- Use structured error types
- Add context to rethrown errors
- Use error boundaries (React) or global handlers
- Monitor errors in production (Sentry)
