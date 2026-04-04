---
name: flutter
description: Flutter/Dart development patterns, state management, and widget design.
globs: ["**/*.dart", "**/pubspec.yaml", "**/android/**", "**/ios/**"]
priority: 85
tags: ["framework"]
---

# Flutter Best Practices

## Widgets
- Keep build methods small
- Use const constructors where possible
- Extract widgets into separate classes
- Use keys properly for stateful widgets
- Prefer composition over deep widget nesting

## State Management
- Use Riverpod for app-level state
- Use ValueNotifier for simple local state
- Use BLoC for complex business logic
- Avoid setState for global state
- Use streams for reactive data

## Performance
- Use `const` widgets to avoid rebuilds
- Use `ListView.builder` for long lists
- Profile with Flutter DevTools
- Use `RepaintBoundary` for expensive widgets
- Cache network images

## Architecture
- Use clean architecture layers
- Separate UI, domain, and data layers
- Use repository pattern for data access
- Use dependency injection
