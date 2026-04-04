---
name: angular
description: Angular framework patterns including signals, dependency injection, and RxJS.
globs: ["**/*.component.ts", "**/*.module.ts", "**/*.service.ts", "**/angular.json"]
priority: 85
tags: ["framework"]
---

# Angular Best Practices

## Architecture
- Use standalone components (Angular 14+)
- Use signals for reactive state (Angular 16+)
- Use lazy loading for feature modules
- Use smart/dumb component pattern
- Use services for business logic

## Dependency Injection
- Use `providedIn: 'root'` for singleton services
- Use `inject()` function over constructor injection
- Use `InjectionToken` for non-class dependencies

## RxJS
- Use `async` pipe in templates
- Unsubscribe properly (takeUntilDestroyed)
- Use `switchMap` for HTTP cancellation
- Use `shareReplay` for shared observables
- Prefer signals over BehaviorSubject

## Performance
- Use `OnPush` change detection
- Use `trackBy` in `*ngFor`
- Use defer blocks for lazy rendering
- Use SSR with Angular Universal
