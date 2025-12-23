# MyLocalCLI ⚡

**Your Own AI Coding Assistant - Private, Local, Yours**

A Claude Code alternative that works with **local LLMs** and free cloud APIs. Now with **agents, skills, project config, and 26 tools**!

![npm](https://img.shields.io/npm/v/mylocalcli)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🏠 **6 AI Providers** - LM Studio, Ollama, OpenRouter, OpenAI, Groq, Custom
- 🛠️ **26 Tools** - File ops, search, git, web fetch, todos, multi-edit
- 🤖 **5 Agents** - Code reviewer, explorer, test generator, refactorer, doc writer
- 🎓 **6 Skills** - Auto-injected best practices for JS, Python, React, etc.
- 📋 **15 Commands** - Slash commands like Claude Code
- 📝 **Project Config** - MYLOCALCLI.md for project-specific instructions
- 🌐 **Web UI** - Beautiful dark theme with voice input
- 🔒 **Private** - Runs locally, your data stays yours

## 🚀 Installation

```bash
npm install -g mylocalcli
```

Now run (both commands work):

```bash
mlc init          # or: mylocalcli init
mlc               # or: mylocalcli
```

## 🎯 Quick Start

```bash
mlc init          # Setup wizard
mlc               # Start chatting
mlc web           # Start Web UI
```

## 📖 Slash Commands (15)

```
/help         - Show all commands
/tools        - List 26 available tools
/agents       - List 5 specialized agents
/skills       - List 6 auto-injecting skills
/init-config  - Create MYLOCALCLI.md project config
/providers    - List AI providers
/models       - List available models
/history      - View saved conversations
/clear        - Clear conversation
/exit         - Exit the chat
```

## 📝 Project Configuration

Create a `MYLOCALCLI.md` file in your project root to give the AI project-specific instructions:

```bash
mlc
> /init-config
```

Or manually create `MYLOCALCLI.md`:

```markdown
---
name: My Project
description: A Node.js API server
---

# Project Instructions

- Use TypeScript for all new files
- Follow REST API conventions
- Write tests for all endpoints
```

The AI will automatically follow these instructions!

## 🤖 Agents System

5 built-in specialized agents:

| Agent | Description |
|-------|-------------|
| `code-reviewer` | Reviews code for bugs, security |
| `code-explorer` | Deep codebase analysis |
| `test-generator` | Generates unit tests |
| `refactorer` | Suggests refactoring improvements |
| `doc-writer` | Generates documentation |

Usage: `/agent code-reviewer Review my authentication code`

## 🎓 Skills (Auto-Inject)

Skills automatically inject relevant best practices based on your project:

| Skill | Triggers On |
|-------|-------------|
| JavaScript | `*.js`, `*.ts`, `*.jsx`, `*.tsx` |
| Python | `*.py` |
| React | `*.jsx`, `*.tsx` |
| Node.js | `package.json`, `server.js` |
| Git | `.git/`, `CONTRIBUTING.md` |
| Testing | `*.test.js`, `*.spec.ts` |

## 🛠️ Tools (26)

**File:** `read_file` `write_file` `edit_file` `multi_edit_file` `delete_file` `copy_file` `move_file` `file_info`

**Search:** `search_files` `grep` `find_replace` `codebase_search`

**Git:** `git_status` `git_diff` `git_log` `git_commit`

**Other:** `run_command` `web_fetch` `todo_write` `ask_user`

## 🤖 Supported Providers

| Provider | Type | Free? |
|----------|------|-------|
| 🏠 LM Studio | Local | ✅ |
| 🦙 Ollama | Local | ✅ |
| 🌐 OpenRouter | Cloud | ✅ |
| ⚡ Groq | Cloud | ✅ |
| 🔑 OpenAI | Cloud | ❌ |
| ⚙️ Custom | Any | - |

## 🦙 Ollama Setup

```bash
ollama pull llama3.2
ollama serve
mlc init  # Select Ollama
```

## 🏠 LM Studio Setup

1. Download [LM Studio](https://lmstudio.ai)
2. Load a model → Start Server (port 1234)
3. Run `mlc init` → Select LM Studio

## 🌐 Web UI

```bash
mlc web
```

Features: Dark theme, voice input, conversation history

## ⌨️ CLI Features (v3.0.1)

- **Input History** - Press ↑/↓ to navigate previous commands
- **Tab Completion** - Type `/` then Tab for command suggestions
- **Multi-line Input** - Start with ``` for code blocks
- **Streaming Progress** - Animated indicator while AI thinks
- **Token Counter** - See context usage percentage

## 🙏 Credits

This project was built with the assistance of:

- **[Google Antigravity](https://deepmind.google/)** - AI pair programming assistant
- **[Anthropic Claude Opus 4.5](https://www.anthropic.com/)** - Advanced AI model for code generation
- **[Claude Code](https://github.com/anthropics/claude-code)** - Inspiration for plugin architecture

## 📄 License

MIT - Use it, modify it, make it yours!

---

**Made with ❤️ by [Prashanth Kumar](https://github.com/kprsnt2)**

⭐ **Star this repo if you find it useful!**

