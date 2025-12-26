# Configuration Guide

This guide covers all configuration options for MyLocalCLI.

## Configuration Locations

```
~/.mylocalcli/           # Global config (user home)
├── config.json          # Provider settings
├── history/             # Conversation history
└── skills/              # Global custom skills

your-project/            # Project config
├── MYLOCALCLI.md        # Project instructions (for AI)
└── .mylocalcli/
    └── skills/          # Project-specific skills
```

## Provider Configuration

### Initial Setup

```bash
mlc init
```

This creates `~/.mylocalcli/config.json`:

```json
{
  "provider": "lmstudio",
  "lmstudio_endpoint": "http://localhost:1234/v1",
  "lmstudio_model": "qwen2.5-coder-7b",
  "openrouter_apikey": "sk-or-...",
  "openrouter_model": "meta-llama/llama-3.3-70b-instruct:free"
}
```

### Provider Settings

#### LM Studio
```json
{
  "provider": "lmstudio",
  "lmstudio_endpoint": "http://localhost:1234/v1",
  "lmstudio_model": "auto"
}
```

#### Ollama
```json
{
  "provider": "ollama",
  "ollama_endpoint": "http://localhost:11434",
  "ollama_model": "llama3.2"
}
```

#### OpenRouter
```json
{
  "provider": "openrouter",
  "openrouter_endpoint": "https://openrouter.ai/api/v1",
  "openrouter_apikey": "sk-or-v1-...",
  "openrouter_model": "meta-llama/llama-3.3-70b-instruct:free"
}
```

#### Groq
```json
{
  "provider": "groq",
  "groq_endpoint": "https://api.groq.com/openai/v1",
  "groq_apikey": "gsk_...",
  "groq_model": "llama-3.3-70b-versatile"
}
```

#### OpenAI
```json
{
  "provider": "openai",
  "openai_endpoint": "https://api.openai.com/v1",
  "openai_apikey": "sk-...",
  "openai_model": "gpt-4o-mini"
}
```

#### Custom Provider
```json
{
  "provider": "custom",
  "custom_endpoint": "http://your-server:8080/v1",
  "custom_apikey": "your-key",
  "custom_model": "your-model"
}
```

### Switching Providers

```bash
mlc
> /provider         # Switch provider
> /model            # Switch model
> /models           # List available models
```

## Project Configuration (MYLOCALCLI.md)

Create project-specific instructions that the AI follows:

### Create with Command

```bash
mlc
> /init-config
```

### Manual Creation

Create `MYLOCALCLI.md` in your project root:

```markdown
---
name: My Project
description: Node.js REST API
author: Your Name
version: 1.0.0
---

# Project Instructions

## Tech Stack
- Node.js with Express
- PostgreSQL with Prisma
- TypeScript

## Coding Standards
- Use TypeScript for all new files
- Use async/await for async code
- Maximum function length: 50 lines
- Use conventional commits

## Testing
- Write tests for all new features
- Use Jest for unit tests
- Minimum 80% coverage

## File Structure
```
src/
├── routes/       # API endpoints
├── services/     # Business logic  
├── models/       # Prisma models
├── middleware/   # Express middleware
└── utils/        # Helper functions
```

## Don't
- Don't use any type
- Don't commit secrets
- Don't use deprecated APIs
```

### Frontmatter Fields

| Field | Description |
|-------|-------------|
| `name` | Project name |
| `description` | Brief description |
| `author` | Author name |
| `version` | Project version |

The content after `---` is injected into AI context.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYLOCALCLI_PROVIDER` | Override provider | config.json |
| `MYLOCALCLI_MODEL` | Override model | config.json |
| `MYLOCALCLI_AUTO_APPROVE` | Skip confirmations | false |

Example:
```bash
MYLOCALCLI_PROVIDER=groq mlc
```

## CLI Arguments

```bash
mlc [options]

Options:
  --init, init       Run setup wizard
  --web, web         Start Web UI
  --version, -v      Show version
  --auto             Auto-approve tool actions
  --help             Show help
```

## Conversation History

History is saved to `~/.mylocalcli/history/`:

```
history/
├── 2024-01-15_project-name.json
├── 2024-01-14_another-project.json
└── ...
```

### Managing History

```bash
mlc
> /history          # View saved conversations
> /clear            # Clear current session
```

## Troubleshooting

### Reset Configuration

```bash
rm -rf ~/.mylocalcli/config.json
mlc init
```

### View Current Config

```bash
mlc
> /config
```

### Debug Mode

```bash
DEBUG=mylocalcli:* mlc
```
