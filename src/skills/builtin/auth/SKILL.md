---
name: auth
description: Authentication and authorization patterns including OAuth, JWT, sessions, and RBAC.
globs: ["**/auth/**", "**/middleware/**", "**/passport*", "**/next-auth*"]
priority: 90
tags: ["security"]
---

# Authentication & Authorization

## JWT
- Use short-lived access tokens (15min)
- Use long-lived refresh tokens (7-30 days)
- Store refresh tokens in httpOnly cookies
- Never store JWTs in localStorage
- Include minimal claims in tokens
- Validate `iss`, `aud`, `exp` on every request

## OAuth 2.0 / OIDC
- Use Authorization Code flow with PKCE
- Never use Implicit flow
- Validate state parameter to prevent CSRF
- Store tokens server-side when possible
- Use ID tokens for authentication, access tokens for authorization

## Session-Based Auth
- Use secure, httpOnly, sameSite cookies
- Regenerate session ID after login
- Set proper session expiry
- Use Redis for session storage in production

## Password Security
- Use bcrypt or argon2id for hashing
- Enforce minimum password complexity
- Implement account lockout after failed attempts
- Use rate limiting on login endpoints
- Support passwordless/passkey authentication

## RBAC / Authorization
- Check permissions on every request (server-side)
- Use middleware for route-level auth
- Implement row-level security
- Use claims-based authorization
- Audit all access to sensitive resources
