# MyLocalCLI ⚡

<div align="center">

**A private, local-first AI coding agent with the IDE wired in.**

[![npm version](https://img.shields.io/npm/v/mylocalcli.svg?style=flat-square&color=7c3aed)](https://www.npmjs.com/package/mylocalcli)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-10b981?style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-gray?style=flat-square)]()
[![Website](https://img.shields.io/badge/docs-mlc.kprsnt.in-06b6d4?style=flat-square)](https://mlc.kprsnt.in)

[Quick Start](#-quick-start) • [Installation](#-installation) • [Architecture & Features](#-architecture--features) • [Providers](#-supported-providers) • [Tools & Skills](#-tools--skills) • [Website](https://mlc.kprsnt.in)

</div>

---

MyLocalCLI is an open-source, local-first AI coding assistant built for the terminal and browser. Inspired by modern agentic architectures like Claude Code, OpenCode, and AmpCode, it combines **parallel tool execution**, **true Stdio MCP bridging**, **multimodal vision**, and **autonomous self-healing loops** with **100% offline local LLM capability** and zero telemetry.

---

## ⚡ Quick Comparison

| Capability | MyLocalCLI (`mlc`) | Claude Code | Standard Chat Wrappers |
|---|---|---|---|
| **Privacy & Local Models** | **100% Offline** (Ollama, LM Studio, vLLM) | Cloud Only | Cloud Only |
| **Tool Execution** | **Parallel (`Promise.all` engine)** | Sequential / Selective | None / Sequential |
| **MCP Integration** | **Native Stdio JSON-RPC Bridge** | Vendor MCP | Mocked / None |
| **User Interface** | **OpenCode Full-Screen TUI + Web UI** | Terminal Readline | Basic CLI |
| **Safety Gateways** | **Interactive PLAN vs BUILD Modes** | Permission Prompts | None |
| **Multimodal Vision** | **Local Image Path Auto-Extraction** | Upload Required | Text Only |
| **Autonomous Loop** | **AutoCode & Hermes Failover** | None | None |
| **Cloud Providers** | NVIDIA API, OpenRouter, Groq, OpenAI | Anthropic Only | Single Provider |
| **Telemetry** | **Zero Telemetry / No Tracking** | Telemetry Active | Varies |

---

## 🚀 Installation

### Global Install (Recommended)

```bash
npm install -g mylocalcli
```

Run either `mlc` or `mylocalcli`:

```bash
mlc init          # Interactive configuration wizard
mlc               # Start full-screen OpenCode TUI
```

### Instant Run (No Install)

```bash
npx mylocalcli
```

### From Source

```bash
git clone https://github.com/kprsnt2/MyLocalCLI.git
cd MyLocalCLI
npm install
npm link
```

---

## 🖥️ Terminal Experience (OpenCode TUI)

MyLocalCLI boots directly into an **OpenCode-style full-screen TUI** powered by React and Ink, running on an alternate screen buffer so your terminal scrollback stays pristine.

```text
╭── MyLocalCLI v4.0.2 ─────────────────────────────────────────────────────────────────── [BUILD] ──╮
│ ⚡ Model: glm-5.3-flash (NVIDIA)   Tokens: 1,420 (2.4k/min)   Context: ⟨████░░░░░░░░░░⟩ 18%        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│  You: Refactor the authentication flow, verify websocket reconnects, and run tests.                │
│                                                                                                     │
│  MLC: Dispatched 3 parallel tool executions:                                                        │
│       ⠋ [Parallel Engine] read_file("src/core/auth.js")                                             │
│       ⠋ [Parallel Engine] read_file("src/ws/client.js")                                             │
│       ⠋ [Parallel Engine] grep("reconnectDelay", "src/")                                            │
│       ✓ 3 operations completed in 14ms                                                              │
│                                                                                                     │
│       Found reconnect vulnerability: `reconnectDelay` lacks exponential jitter.                      │
│       Applying AST patch to `src/ws/client.js`...                                                   │
│                                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [BUILD] You: █                                                                                      │
╰─ [Tab] Toggle Mode • [$] Shell • [$$] Incognito Shell • [/help] Commands • [Esc] Exit ──────────────╯
```

---

## 🎯 Quick Start

### 1. Initialize Configuration

```bash
mlc init
```

The interactive wizard configures:
- Your AI provider (LM Studio, Ollama, NVIDIA, OpenRouter, Groq, OpenAI, or Custom).
- Endpoint URL and API keys (stored safely in `~/.mylocalcli/config.json`).
- Default model selection.

### 2. Verify Connectivity (`doctor`)

Check your local model servers, endpoints, and credentials:

```bash
mlc doctor
```

```text
  Provider Health Check
  🏠 LM Studio    Connected  (3 models at http://localhost:1234/v1)
  🦙 Ollama       Connected  (4 models at http://localhost:11434)
  🟢 NVIDIA API   Connected  (API key valid)
  🌐 OpenRouter   Connected  (API key valid)
```

### 3. Start Coding

```bash
mlc                      # Full-screen OpenCode TUI (Default)
mlc --classic            # Classic terminal readline mode
mlc web                  # Browser Web UI with voice input (http://localhost:3456)
mlc "Explain src/index.js" # Shorthand single-prompt execution
```

---

## 💎 Key Features & Architecture

### ⚡ Parallel Tool Execution Engine
Unlike older assistants that block sequentially on every tool call, MyLocalCLI v4.0.2 dispatches concurrent calls using `Promise.all`. The model can read multiple files, search text, and run diagnostics simultaneously in a fraction of a second.

### 🔌 Standard-IO MCP Bridge
Native integration with the **Model Context Protocol (MCP)** ecosystem. Spawns MCP server subprocesses over `stdio` with robust JSON-RPC stream multiplexing, enabling any MCP-compliant tool to plug in seamlessly.

### 👁️ Multimodal Vision Injection
Pass any local `.png`, `.webp`, or `.jpg` file path in your chat prompt. MyLocalCLI automatically inspects the file, extracts the base64 data payload, and injects it into vision-capable local models (such as LLaVA) or cloud vision APIs.

### 🛡️ Interactive PLAN vs. BUILD Gateways
- **BUILD Mode** 🔨: Full read/write and command execution access for active development.
- **PLAN Mode** 📋: Safe, read-only analysis. Destructive operations (file edits, deletes, shell mutations) are strictly locked behind manual validation prompts.
- **Instant Mode Switching**: Press `Tab` anytime in the prompt to toggle between modes.

### 🤖 AutoCode Autonomous Loop & Hermes Evolution
- **AutoCode Loop**: Autonomous multi-turn problem-solving that executes tasks, validates syntax, and iterates until tests pass.
- **Hermes Self-Evolution & Failover**: Automatic fallback between providers when rates limits, context overflow, or connection drops occur.

### 🌐 Dual Interface: Full-Screen TUI & Web UI
- **TUI Mode**: Built with Ink and React 19. Features live token counters, a visual context window progress indicator (`⟨████░░░░⟩ 32%`), animated Braille thinking spinners, syntax highlighting, and screen-resize auto-redraws.
- **Web UI Mode** (`mlc web`): A sleek dark-mode browser interface at `http://localhost:3456` with live streaming, conversation history, and Web Speech API voice input.

### 💻 Shell Passthrough Modes
- `$ <command>`: Execute a shell command and add its stdout/stderr to the AI's conversation context.
- `$$ <command>`: **Incognito shell execution**. Runs the command locally without polluting the AI's context window.

---

## 🤖 Supported Providers (100% Free & Local-First)

MyLocalCLI is designed around **zero-cost, private, and unrestricted workflows**. No paid API subscriptions required:

| Provider | Type | Privacy | 100% Free? | Recommended Free Models |
|---|---|---|---|---|
| 🦙 **Ollama** | Local Offline | 100% Private | ✅ Yes | `qwen2.5-coder`, `llama3.3`, `deepseek-r1` |
| 🏠 **LM Studio** | Local Offline | 100% Private | ✅ Yes | Any GGUF from Hugging Face (`localhost:1234`) |
| 🌐 **OpenRouter** | Cloud Endpoint | Encrypted | ✅ Free Tier | `deepseek/deepseek-r1:free`, `meta-llama/llama-3.3-70b-instruct:free` |
| ⚡ **Groq** | Cloud Endpoint | Encrypted | ✅ Free Tier | `llama-3.3-70b-versatile` (300+ tok/s) |
| ⚡ **vLLM** | Self-Hosted | 100% Private | ✅ Yes | Any local Hugging Face model (`localhost:8000`) |
| 🟢 **NVIDIA NIM** | Cloud Endpoint | Encrypted | ✅ Free Trial | `nvidia/llama-3.1-nemotron-70b-instruct`, `meta/llama-3.1-70b-instruct` |
| 🔑 **OpenAI** | Cloud Endpoint | Encrypted | ❌ Paid | `gpt-4o`, `gpt-4o-mini` |
| ⚙️ **Custom API** | Any Endpoint | Your Choice | — | Any OpenAI-compatible REST endpoint |

> 🔒 **Model Stability Guarantee**: MyLocalCLI strictly honors the model you specify. Models are **never automatically changed or auto-updated** in the background.

## 🛠️ 42 Built-in Tools

The AI agent has access to 42 specialized tools categorized for full-stack engineering:

### File Operations & Code Modification
- `read_file`, `read_lines`: Efficiently read full files or targeted line slices.
- `write_file`, `append_file`: Create or append content.
- `edit_file`, `multi_edit_file`: Precision fuzzy-match file modifications.
- `patch_file`: Unified diff / patch applicator.
- `copy_file`, `move_file`, `delete_file`: File management.
- `insert_at_line`: Targeted line insertions.
- `file_info`: Metadata, timestamps, byte size.
- `compare_files`: Visual side-by-side diffing between two files.
- `batch_rename`: Pattern-based mass file renaming.

### Search & Codebase Navigation
- `list_directory`: Tree-aware directory traversal.
- `search_files`: Glob-based file discovery.
- `grep`: Regex text search across the workspace.
- `tree`: Visual hierarchical directory structure.
- `find_replace`: Global find and replace across multiple files.
- `codebase_search`: Contextual code indexing and semantic lookup.
- `project_stats`: Codebase metrics (line counts, file distributions, languages).

### Git & Source Control
- `git_status`: Inspect staged/unstaged changes and untracked files.
- `git_diff`: View working tree and staged diffs.
- `git_log`: Commit history inspection.
- `git_commit`: Create standard or conventional commits.

### Execution, System & Web
- `run_command`: Cross-platform shell executor with Windows command translation (`ls` → `dir`, `cat` → `type`, `rm` → `del`).
- `web_fetch`: Fetch and parse remote web pages and APIs.
- `todo_write`: Dynamic task list tracking for complex multi-stage tasks.
- `ask_user`: Interactive user clarification prompts.
- `create_directory`: Recursive directory creation.

---

## 🎓 38 Dynamic Skills

Skills automatically inject best-practice instructions into the system prompt when matching project files are detected:

| Category | Skills Included | Triggers |
|---|---|---|
| **Languages** | JavaScript, TypeScript, Python, Rust, Go | `*.js`, `*.ts`, `*.py`, `*.rs`, `*.go` |
| **Frameworks** | React, Next.js, Vue, Svelte, Angular, Express, FastAPI, Django | `*.jsx`, `*.tsx`, `next.config.*`, `*.vue`, `*.svelte` |
| **Styling** | Tailwind CSS | `tailwind.config.*`, `@tailwind` |
| **DevOps** | Docker, Kubernetes, CI/CD, AWS, Terraform | `Dockerfile`, `k8s/`, `.github/workflows/`, `*.tf` |
| **Databases** | PostgreSQL, MongoDB, Redis, SQL | `*.sql`, `prisma/`, `schema.prisma`, `models/` |
| **Architecture** | Microservices, API Design, Performance, Security | `routes/`, `api/`, `SECURITY.md` |
| **Workflow** | Testing, Debugging, Code Review, Git Workflow, Refactoring | `*.test.js`, `*.spec.ts`, `.git/` |

### Custom Skills

Create your own project or global skills:
```markdown
# .mylocalcli/skills/my-framework/SKILL.md
---
name: my-framework
description: Internal architectural guidelines for our microservices
globs: ["services/**"]
priority: 95
---

# Guidelines
- Every endpoint must validate inputs with Zod schemas.
- Database transactions must use the standard Unit-of-Work pattern.
```

---

## 🤖 5 Specialized Agents

Switch between specialized personas tailored to specific engineering tasks:

```bash
/agent code-reviewer  Review src/auth/jwt.js for token expiry race conditions
/agent code-explorer  Trace how database transactions propagate through services
/agent test-generator Generate comprehensive Vitest unit tests for src/utils/files.js
/agent refactorer     Extract business logic into clean domain services
/agent doc-writer     Generate OpenAPI specification for routes/
```

---

## 📋 Slash Commands Reference

Inside the interactive chat, access commands using `/`:

| Command | Description |
|---|---|
| `/help` | Display all available commands and shortcuts |
| `/tools` | List all 42 registered tools and their statuses |
| `/agents` | View and activate specialized agents |
| `/skills` | List active auto-injected skills |
| `/provider` | Switch active provider (LM Studio, Ollama, NVIDIA, etc.) |
| `/model` | Switch the active model for the current provider |
| `/models` | Fetch and list available models from the provider |
| `/pin <file>` | Pin a file so it is permanently included in context |
| `/unpin <file>` | Unpin a file from context |
| `/pins` | Display currently pinned files |
| `/branch <name>` | Create an isolated conversation branch |
| `/checkout <name>` | Switch between conversation branches |
| `/branches` | List all active conversation branches |
| `/doctor` | Run provider and network health checks |
| `/cost` | Display token usage metrics and cost estimation |
| `/history` | View previous saved sessions |
| `/clear` | Clear current chat context and reset memory |
| `/exit` | Exit the CLI session |

---

## 📝 Project Configuration (`MYLOCALCLI.md`)

Drop a `MYLOCALCLI.md` file in the root of any repository to give the AI custom rules, architecture overviews, or coding standards:

```bash
mlc
> /init-config
```

```markdown
---
name: Web Service API
description: Fastify & TypeScript microservice
---

# Engineering Standards
- All code must strictly use TypeScript with strict null checks.
- Never write raw SQL; always utilize Prisma queries.
- When adding new endpoints, create corresponding integration tests in `tests/integration/`.
- Conventional commit messages required: `feat:`, `fix:`, `refactor:`, `chore:`.
```

---

## 🛡️ Privacy & Security First

- **Zero Telemetry**: MyLocalCLI does not track, phone home, or collect analytical metrics.
- **Local Stays Local**: When using LM Studio, Ollama, or local vLLM, prompts, files, and completions never touch external servers.
- **Safe Key Storage**: Cloud API keys are stored locally on your machine in `~/.mylocalcli/config.json` with system user permissions.
- **Fully Auditable**: 100% open-source MIT-licensed code.

---

## 🌐 Documentation Website

Visit our documentation site at [mlc.kprsnt.in](https://mlc.kprsnt.in) for in-depth guides, configuration templates, and tutorials.

To run the docs locally:

```bash
cd website
npm install
npm run dev
```

---

## 📄 License

MIT © [Prashanth Kumar](https://github.com/kprsnt2)
