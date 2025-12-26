# Skills System

Skills are knowledge packs that automatically inject best practices into your AI conversations based on the files in your project.

## How Skills Work

1. **Detection**: When you start a chat, MyLocalCLI scans your project files
2. **Matching**: Skills are matched based on file patterns (globs)
3. **Injection**: Relevant best practices are injected into the AI context
4. **Priority**: Higher priority skills are injected first

## Built-in Skills (22)

### Languages

| Skill | Description | Triggers On |
|-------|-------------|-------------|
| **javascript** | ES6+, TypeScript, async patterns | `*.js`, `*.ts`, `*.jsx`, `*.tsx` |
| **python** | PEP 8, modern Python 3.10+ | `*.py`, `pyproject.toml` |
| **rust** | Ownership, error handling, async | `*.rs`, `Cargo.toml` |
| **go** | Idiomatic Go, concurrency | `*.go`, `go.mod` |

### Frameworks

| Skill | Description | Triggers On |
|-------|-------------|-------------|
| **react** | Hooks, state management, performance | `*.jsx`, `*.tsx` |
| **vue** | Composition API, Pinia | `*.vue` |
| **nextjs** | App Router, data fetching, SEO | `next.config.*` |
| **express** | Middleware, error handling | `server.js`, `routes/**` |
| **django** | ORM, views, security | `settings.py`, `views.py` |
| **fastapi** | Pydantic, dependency injection | `main.py`, `routers/**` |

### DevOps

| Skill | Description | Triggers On |
|-------|-------------|-------------|
| **docker** | Multi-stage builds, security | `Dockerfile` |
| **kubernetes** | Deployments, security | `k8s/**/*.yaml` |
| **cicd** | GitHub Actions, pipelines | `.github/workflows/*.yml` |

### Databases

| Skill | Description | Triggers On |
|-------|-------------|-------------|
| **sql** | Query optimization, indexing | `*.sql`, `migrations/**` |
| **mongodb** | Schema design, indexing | `models/**/*.js` |
| **redis** | Caching patterns, data structures | `redis*.js`, `cache*.js` |

### Best Practices

| Skill | Description | Triggers On |
|-------|-------------|-------------|
| **security** | OWASP Top 10, auth, encryption | All code files |
| **testing** | Unit, integration, E2E tests | `*.test.js`, `*.spec.ts` |
| **git-workflow** | Conventional commits, branching | `.git/**` |
| **api-design** | REST, GraphQL, versioning | `routes/**`, `api/**` |
| **performance** | Core Web Vitals, caching | `*.html`, `*.css` |
| **nodejs** | Async patterns, error handling | `package.json` |

## Skill Priority

Skills have priority levels (higher = more important):

| Priority | Skills |
|----------|--------|
| **100** | javascript, python, security |
| **95** | react, vue |
| **90** | nextjs, django, fastapi, go, rust, nodejs |
| **85** | express, api-design, testing |
| **80** | docker, git-workflow, sql |
| **75** | cicd, mongodb, performance |
| **70** | kubernetes, redis |

## Creating Custom Skills

### 1. Using the Command

```bash
mlc
> /init-skill my-skill-name
```

This creates `.mylocalcli/skills/my-skill-name/SKILL.md`

### 2. Manual Creation

Create the file structure:

```
.mylocalcli/
└── skills/
    └── my-framework/
        └── SKILL.md
```

### 3. SKILL.md Format

```markdown
---
name: my-framework
description: Best practices for My Framework
globs: ["**/*.myf", "**/*.framework"]
priority: 80
tags: ["framework"]
---

# My Framework Best Practices

## Coding Standards
- Use framework-specific patterns
- Follow the official style guide

## Error Handling
- Use the built-in error types
- Log errors with context

## Performance
- Enable caching
- Use lazy loading
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Skill identifier (lowercase, hyphens) |
| `description` | Yes | What this skill provides |
| `globs` | Yes | File patterns that trigger this skill |
| `priority` | No | 1-100, higher = more important (default: 50) |
| `tags` | No | Categories for grouping |
| `alwaysApply` | No | Patterns that always trigger this skill |

### Glob Patterns

```yaml
globs: [
  "**/*.js",           # All JS files
  "src/**/*.ts",       # TS files in src/
  "**/package.json",   # package.json anywhere
  "!**/node_modules/**" # Exclude node_modules
]
```

## Skill Locations

Skills are loaded from (in order):

1. **Built-in**: `src/skills/builtin/` (22 skills)
2. **Global**: `~/.mylocalcli/skills/`
3. **Project**: `.mylocalcli/skills/`

Project skills override global skills with the same name.

## Viewing Skills

```bash
mlc
> /skills           # List all skills
> /skills -v        # Verbose with triggers
> /skills -g        # Grouped by category
```

## Disabling Skills

To disable a skill for a project, create an empty skill with the same name:

```markdown
---
name: security
description: Disabled
globs: []
---
```

## Best Practices for Custom Skills

1. **Be Specific**: Focus on one technology/framework
2. **Use Examples**: Show code examples, not just rules
3. **Keep Updated**: Update skills as best practices evolve
4. **Set Priority**: Higher for more critical advice
5. **Test Triggers**: Verify globs match your files
