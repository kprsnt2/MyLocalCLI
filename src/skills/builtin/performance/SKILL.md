---
name: performance
description: Web performance optimization best practices including Core Web Vitals, loading, and caching.
globs: ["**/*.html", "**/*.css", "**/*.js", "**/webpack.config.*", "**/vite.config.*"]
priority: 75
tags: ["performance"]
---

# Web Performance Best Practices

## Core Web Vitals
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- Measure with Lighthouse/WebPageTest

## Loading Performance
- Minimize bundle size
- Code split by route
- Lazy load images/components
- Use preload for critical resources
- Enable compression (gzip/brotli)

## JavaScript
- Tree shake unused code
- Defer non-critical scripts
- Use Web Workers for heavy computation
- Debounce/throttle event handlers
- Avoid memory leaks

## CSS
- Minimize CSS
- Use critical CSS inline
- Avoid layout thrashing
- Use CSS containment
- Prefer transform over position

## Images
- Use modern formats (WebP, AVIF)
- Implement responsive images
- Lazy load below-fold images
- Use image CDN
- Compress appropriately

## Caching
- Set proper cache headers
- Use service workers
- Cache API responses
- Use edge caching (CDN)
- Implement stale-while-revalidate

## Network
- Use HTTP/2 or HTTP/3
- Reduce DNS lookups
- Use connection preload/preconnect
- Minimize redirects
- Enable HTTPS
