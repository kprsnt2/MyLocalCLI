---
name: vue
description: Vue.js development best practices including Composition API, state management, and performance.
globs: ["**/*.vue", "**/nuxt.config.*", "**/vite.config.*"]
priority: 95
tags: ["framework"]
---

# Vue.js Best Practices

## Composition API (Vue 3)
- Use script setup for cleaner code
- Use ref() for primitives, reactive() for objects
- Use computed() for derived state
- Use watch/watchEffect for side effects
- Create composables for reusable logic

## Component Design
- One component per file
- Use defineProps with TypeScript
- Use defineEmits for events
- Keep templates readable
- Use slots for flexibility

## State Management
- Use Pinia over Vuex
- Keep stores focused
- Use getters for derived state
- Use actions for async logic

## Performance
- Use v-show for frequent toggles
- Use v-if for conditional rendering
- Use key for list rendering
- Lazy load routes
- Use defineAsyncComponent

## Best Practices
- Follow Vue Style Guide (Priority A rules)
- Use SFC format
- Validate props
- Use provide/inject sparingly
