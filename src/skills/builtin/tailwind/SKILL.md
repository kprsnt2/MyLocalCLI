---
name: tailwind
description: Tailwind CSS utility-first styling patterns and responsive design.
globs: ["**/*.jsx", "**/*.tsx", "**/*.vue", "**/*.svelte", "**/tailwind.config.*"]
priority: 80
tags: ["framework"]
---

# Tailwind CSS Best Practices

## Layout
- Use `flex`, `grid` for layouts
- Use `container mx-auto` for centered content
- Use `space-x-*`, `space-y-*` for spacing between children
- Use `gap-*` with flex/grid
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

## Components
- Extract repeated patterns to components, not `@apply`
- Use `group` and `group-hover:` for parent-child interactions
- Use `peer` and `peer-checked:` for sibling interactions
- Use `ring-*` for focus styles
- Use `divide-*` for borders between children

## Dark Mode
- Use `dark:` prefix for dark mode styles
- Set `darkMode: 'class'` in config
- Use CSS variables for theme colors

## Performance
- Use JIT mode (default in v3+)
- Purge unused styles in production
- Avoid arbitrary values when possible
- Use `@layer` for custom utilities

## Responsive
- Mobile-first: base styles for mobile, add breakpoints for larger
- Use `max-*:` for max-width breakpoints
- Use `container` queries with `@container`
