---
name: refactoring
description: Code refactoring patterns, clean code principles, and safe transformation techniques.
globs: ["**/*.js", "**/*.ts", "**/*.py", "**/*.java", "**/*.go", "**/*.rs"]
priority: 85
tags: ["workflow"]
---

# Refactoring Best Practices

## Before Refactoring
- Ensure tests exist and pass
- Understand the current behavior
- Make small, incremental changes
- Commit after each refactoring step
- Use feature flags for large refactors

## Code Smells to Fix
- Long methods (> 30 lines) -> Extract method
- Large classes -> Extract class
- Long parameter lists -> Introduce parameter object
- Duplicate code -> Extract shared function
- Deep nesting -> Early returns / guard clauses
- Magic numbers -> Named constants
- God objects -> Single responsibility

## Safe Refactoring Techniques
- Rename for clarity (variables, functions, classes)
- Extract method/function
- Inline temporary variables
- Replace conditional with polymorphism
- Move method to appropriate class
- Replace loop with pipeline (map/filter/reduce)
- Introduce null object pattern

## Clean Code Principles
- Functions should do one thing
- Functions should be < 20 lines ideally
- No side effects in pure functions
- Use descriptive names (no abbreviations)
- Comments explain WHY, not WHAT
- DRY but don't over-abstract
