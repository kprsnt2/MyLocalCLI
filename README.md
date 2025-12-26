# MyLocalCLI ⚡

**Your Own AI Coding Assistant - Private, Local, Yours**

A Claude Code alternative that works with **local LLMs** and free cloud APIs. Now with **agents, skills, project config, and cross-platform support**!

[![npm](https://img.shields.io/npm/v/mylocalcli)](https://www.npmjs.com/package/mylocalcli)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)]()

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 **6 AI Providers** | LM Studio, Ollama, OpenRouter, OpenAI, Groq, Custom |
| 🛠️ **26 Tools** | File ops, search, git, web fetch, todos, multi-edit |
| 🤖 **5 Agents** | Code reviewer, explorer, test generator, refactorer, doc writer |
| 🎓 **22 Skills** | Auto-injected best practices for JS, Python, React, and more |
| 📋 **15+ Commands** | Slash commands like Claude Code |
| 📝 **Project Config** | MYLOCALCLI.md for project-specific instructions |
| 🌐 **Web UI** | Beautiful dark theme with voice input |
| 🔄 **Cross-Platform** | Works on Windows, macOS, and Linux |
| 🔒 **Private** | Runs locally, your data stays yours |

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

### 1. Setup (First Time)

```bash
mlc init
```

This wizard helps you:
- Choose an AI provider (LM Studio, Ollama, OpenRouter, etc.)
- Configure API endpoints and keys
- Select a model

### 2. Start Chatting

```bash
mlc
```

### 3. Try the Web UI

```bash
mlc web
```

Open http://localhost:3000 in your browser.

## 📖 Usage Guide

### Basic Chat

Just type your question or request:

```
You: Explain this function
You: Fix the bug in src/utils.js
You: Create a REST API for user authentication
```

### Slash Commands

```
/help         - Show all commands
/tools        - List 26 available tools
/agents       - List 5 specialized agents  
/skills       - List 22 auto-injecting skills
/init-config  - Create MYLOCALCLI.md project config
/provider     - Switch AI provider
/model        - Switch model
/models       - List available models
/history      - View saved conversations
/clear        - Clear conversation
/exit         - Exit the chat
```

### Multi-line Input

Start with triple backticks for code blocks:

````
You: ```
function add(a, b) {
  return a + b;
}
```
Explain this code
````

## 🛠️ Tools (26)

MyLocalCLI has 26 built-in tools the AI can use:

### File Operations
| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Create or overwrite files |
| `edit_file` | Edit specific parts of files (fuzzy matching) |
| `multi_edit_file` | Make multiple edits in one operation |
| `delete_file` | Delete files or directories |
| `copy_file` | Copy files |
| `move_file` | Move or rename files |
| `file_info` | Get file metadata (size, dates) |
| `append_file` | Append content to files |
| `insert_at_line` | Insert at specific line number |
| `read_lines` | Read specific line range |

### Search & Navigation
| Tool | Description |
|------|-------------|
| `list_directory` | List directory contents |
| `search_files` | Find files by glob pattern |
| `grep` | Search text in files |
| `tree` | Show directory structure |
| `find_replace` | Find and replace across files |
| `codebase_search` | Semantic code search |

### Git Operations
| Tool | Description |
|------|-------------|
| `git_status` | Get repository status |
| `git_diff` | Show changes |
| `git_log` | Show commit history |
| `git_commit` | Create commits |

### Other
| Tool | Description |
|------|-------------|
| `run_command` | Execute shell commands (cross-platform!) |
| `web_fetch` | Fetch content from URLs |
| `todo_write` | Maintain task lists |
| `ask_user` | Ask user for input/confirmation |
| `create_directory` | Create directories |

### Cross-Platform Commands

Commands like `ls`, `cat`, `rm` are automatically translated on Windows:

```
Unix → Windows
ls   → dir
cat  → type
rm   → del
cp   → copy
mv   → move
pwd  → cd
```

## 🤖 Agents (5)

Agents are specialized personas for specific tasks:

| Agent | Description | Example |
|-------|-------------|---------|
| `code-reviewer` | Reviews code for bugs, security, style | `/agent code-reviewer Review auth.js` |
| `code-explorer` | Deep codebase analysis | `/agent code-explorer How does the auth flow work?` |
| `test-generator` | Generates unit tests | `/agent test-generator Create tests for utils.js` |
| `refactorer` | Suggests improvements | `/agent refactorer Refactor the User class` |
| `doc-writer` | Generates documentation | `/agent doc-writer Document the API endpoints` |

## 🎓 Skills (22)

Skills automatically inject best practices based on your project files:

### Languages
| Skill | Triggers On | Priority |
|-------|-------------|----------|
| JavaScript | `*.js`, `*.ts`, `*.jsx`, `*.tsx` | 100 |
| Python | `*.py`, `pyproject.toml` | 100 |
| Rust | `*.rs`, `Cargo.toml` | 90 |
| Go | `*.go`, `go.mod` | 90 |

### Frameworks
| Skill | Triggers On | Priority |
|-------|-------------|----------|
| React | `*.jsx`, `*.tsx` | 95 |
| Vue | `*.vue` | 95 |
| Next.js | `next.config.*`, `app/**` | 90 |
| Express | `server.js`, `routes/**` | 85 |
| Django | `settings.py`, `views.py` | 90 |
| FastAPI | `main.py`, `routers/**` | 90 |

### DevOps & Databases
| Skill | Triggers On | Priority |
|-------|-------------|----------|
| Docker | `Dockerfile`, `docker-compose.yml` | 80 |
| Kubernetes | `k8s/**/*.yaml` | 70 |
| CI/CD | `.github/workflows/*.yml` | 75 |
| SQL | `*.sql`, `migrations/**` | 80 |
| MongoDB | `models/**/*.js` | 75 |
| Redis | `redis*.js`, `cache*.js` | 70 |

### Best Practices
| Skill | Triggers On | Priority |
|-------|-------------|----------|
| Security | All code files, `SECURITY.md` | 100 |
| Testing | `*.test.js`, `*.spec.ts` | 85 |
| Git Workflow | `.git/**`, `CONTRIBUTING.md` | 80 |
| API Design | `routes/**`, `api/**` | 85 |
| Performance | `*.html`, `*.css`, `*.js` | 75 |
| Node.js | `package.json`, `index.js` | 90 |

### Custom Skills

Create your own skills in `.mylocalcli/skills/<name>/SKILL.md`:

```bash
mlc
> /init-skill my-framework
```

Or manually:

```markdown
---
name: my-framework
description: Best practices for My Framework
globs: ["**/*.myf"]
priority: 50
tags: ["custom"]
---

# My Framework Best Practices

- Guideline 1
- Guideline 2
```

## 📝 Project Configuration

Create a `MYLOCALCLI.md` file in your project root to give the AI project-specific instructions:

```bash
mlc
> /init-config
```

Example `MYLOCALCLI.md`:

```markdown
---
name: My Project
description: A Node.js API server
author: Your Name
---

# Project Instructions

- Use TypeScript for all new files
- Follow REST API conventions  
- Write tests for all endpoints
- Use Prisma for database access
- Follow conventional commits

# Coding Standards

- Use ESLint and Prettier
- Maximum function length: 50 lines
- Always handle errors with try/catch

# File Structure

```
src/
├── routes/     # API routes
├── services/   # Business logic
├── models/     # Database models
└── utils/      # Helpers
```
```

## 🤖 Supported Providers

| Provider | Type | Free? | Setup |
|----------|------|-------|-------|
| 🏠 **LM Studio** | Local | ✅ | Download LM Studio → Load model → Start server |
| 🦙 **Ollama** | Local | ✅ | `ollama pull llama3.2 && ollama serve` |
| 🌐 **OpenRouter** | Cloud | ✅ | Get free API key from openrouter.ai |
| ⚡ **Groq** | Cloud | ✅ | Get free API key from console.groq.com |
| 🔑 **OpenAI** | Cloud | ❌ | Requires paid API key |
| ⚙️ **Custom** | Any | - | Any OpenAI-compatible endpoint |

### Recommended Free Setup

**Option 1: Local (Privacy) - LM Studio**
```bash
# 1. Download LM Studio from https://lmstudio.ai
# 2. Load a model (e.g., Qwen 2.5 Coder 7B)
# 3. Start Local Server (port 1234)
mlc init  # Select LM Studio
```

**Option 2: Local (Lightweight) - Ollama**
```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2
ollama serve
mlc init  # Select Ollama
```

**Option 3: Cloud (Free) - OpenRouter**
```bash
# Get free API key from https://openrouter.ai
mlc init  # Select OpenRouter → Enter API key
```

## 🌐 Web UI

```bash
mlc web
# Opens http://localhost:3000
```

Features:
- 🌙 Beautiful dark theme
- 🎤 Voice input support
- 💬 Conversation history
- 🔄 Provider/model switching
- 📱 Mobile-friendly

## ⌨️ CLI Features

| Feature | Description |
|---------|-------------|
| **Input History** | Press ↑/↓ to navigate previous commands |
| **Tab Completion** | Type `/` then Tab for command suggestions |
| **Multi-line Input** | Start with ``` for code blocks |
| **Streaming** | Real-time response display |
| **Token Counter** | See context usage percentage |
| **Auto-approval** | Use `mlc --auto` for unattended operation |

## 🔧 Configuration

Configuration is stored in `~/.mylocalcli/`:

```
~/.mylocalcli/
├── config.json      # Provider settings
├── history/         # Conversation history
└── skills/          # Custom skills (global)
```

Project-local configuration:
```
your-project/
├── MYLOCALCLI.md       # Project instructions
└── .mylocalcli/
    └── skills/         # Project-specific skills
```

## 🛡️ Privacy & Security

> ⚠️ **Important Privacy Notice**

### Local Providers (Full Privacy ✅)
- **LM Studio, Ollama**: All data stays on YOUR machine
- **No data leaves your computer** - 100% private
- **Recommended for sensitive code**

### Cloud Providers (Data Shared ⚠️)
- **OpenRouter, Groq, OpenAI**: Your code/prompts ARE sent to their servers
- These providers **may log or store your data** per their privacy policies
- Good for **non-sensitive projects** or trying the tool quickly

### For Maximum Privacy

If you need **full privacy with cloud-grade performance**, run your own model:

```bash
# Option 1: vLLM (GPU required)
pip install vllm
vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000

# Option 2: Use vLLM with Custom provider in mlc
mlc init  # Select "Custom" → Enter http://localhost:8000/v1
```

### Quick Start Links

| Provider | Privacy | Link |
|----------|---------|------|
| 🏠 LM Studio | ✅ Full | [lmstudio.ai](https://lmstudio.ai) |
| 🦙 Ollama | ✅ Full | [ollama.ai](https://ollama.ai) |
| ⚡ vLLM (Self-hosted) | ✅ Full | [docs.vllm.ai](https://docs.vllm.ai) |
| 🌐 OpenRouter | ⚠️ Cloud | [openrouter.ai](https://openrouter.ai) |
| ⚡ Groq | ⚠️ Cloud | [console.groq.com](https://console.groq.com) |

### Security Best Practices
- **API keys**: Stored locally in `~/.mylocalcli/config.json`
- **No telemetry**: MyLocalCLI does NOT collect any usage data
- **Open source**: Audit the code yourself on [GitHub](https://github.com/kprsnt2/MyLocalCLI)

## 🐛 Troubleshooting

### "Connection refused" error
- Make sure LM Studio/Ollama server is running
- Check the port (default: 1234 for LM Studio, 11434 for Ollama)

### Command not found on Windows
- Unix commands are auto-translated (ls → dir)
- If it still fails, use Windows commands directly

### Slow responses
- Try a smaller model
- Use Groq for fast cloud inference
- Reduce context with `/clear`

### Model not loading
- Check available disk space
- Verify model compatibility with your hardware

## 🙏 Credits

Built with the assistance of:
- **[Google Antigravity](https://deepmind.google/)** - AI pair programming
- **[Anthropic Claude](https://www.anthropic.com/)** - Advanced AI capabilities
- **[Claude Code Skills](https://github.com/anthropics/skills)** - Inspiration for skills system

## 📄 License

MIT - Use it, modify it, make it yours!

---

**Made with ❤️ by [Prashanth Kumar](https://github.com/kprsnt2)**

⭐ **Star this repo if you find it useful!**
