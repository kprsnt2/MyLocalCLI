---
name: svelte
description: Svelte and SvelteKit development patterns, reactivity, and server-side rendering.
globs: ["**/*.svelte", "**/svelte.config.*", "**/+page.*", "**/+layout.*"]
priority: 85
tags: ["framework"]
---

# Svelte Best Practices

## Reactivity
- Use `$:` for reactive declarations
- Use `$state` rune in Svelte 5
- Use `$derived` for computed values in Svelte 5
- Use `$effect` for side effects in Svelte 5
- Avoid mutating objects directly — reassign

## Components
- Keep components small and focused
- Use slots for composition
- Use `{@html}` sparingly (XSS risk)
- Use transitions and animations built-in
- Use stores for shared state

## SvelteKit
- Use `+page.svelte` for pages, `+layout.svelte` for layouts
- Use `+page.server.ts` for server-side data
- Use `+server.ts` for API routes
- Use form actions for progressive enhancement
- Use hooks for middleware logic
