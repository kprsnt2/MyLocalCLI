---
name: code-review
description: Code review checklist and patterns for thorough, constructive reviews.
globs: ["**/*.js", "**/*.ts", "**/*.py", "**/*.java", "**/*.go", "**/*.rs"]
priority: 85
tags: ["workflow"]
---

# Code Review Checklist

## Correctness
- Does the code do what it claims?
- Are edge cases handled?
- Are error paths handled gracefully?
- Are race conditions possible?
- Is input validated?

## Security
- No hardcoded secrets or credentials
- Input sanitization (SQL injection, XSS)
- Proper authentication/authorization checks
- No sensitive data in logs
- Secure defaults

## Performance
- No N+1 queries
- Appropriate caching
- No unnecessary computations in loops
- Proper pagination for lists
- No memory leaks (event listeners, subscriptions)

## Maintainability
- Clear naming conventions
- Functions do one thing
- No magic numbers
- Appropriate comments (why, not what)
- Tests cover the changes
- No dead code

## Style
- Consistent with codebase style
- No unnecessary complexity
- Proper error messages
- Logging at appropriate levels

## Review Etiquette
- Be constructive, not critical
- Ask questions instead of making demands
- Praise good code
- Focus on the code, not the person
- Suggest improvements, don't just point out problems
