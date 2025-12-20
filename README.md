# MyLocalCLI ⚡

**Your Own AI Coding Assistant - Private, Local, Yours**

A Claude Code alternative that works with **local LLMs** and free cloud APIs.

![npm](https://img.shields.io/npm/v/mylocalcli)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🏠 **6 AI Providers** - LM Studio, Ollama, OpenRouter, OpenAI, Groq, Custom
- 🛠️ **22 Tools** - File ops, search, git, web fetch (Claude Code style)
- 🌐 **Web UI** - Beautiful dark theme with voice input
- 💬 **Conversations** - Save, load, export chat history
- 🔒 **Private** - Runs locally, your data stays yours

## 🚀 Installation

### Install from npm (Recommended)

```bash
npm install -g mylocalcli
```

That's it! Now run:

```bash
mylocalcli init    # Setup wizard
mylocalcli         # Start chatting
```

### Alternative: Install from GitHub

```bash
# Clone and install
git clone https://github.com/kprsnt2/MyLocalCLI.git
cd MyLocalCLI
npm install
npm link
```

### Alternative: Run without installing

```bash
npx mylocalcli
```

## 🎯 Quick Start

```bash
# First time setup
mylocalcli init

# Start CLI chat
mylocalcli

# Start Web UI
mylocalcli web
```

## 🤖 Supported Providers

| Provider | Type | Description | Free? |
|----------|------|-------------|-------|
| 🏠 LM Studio | Local | Run any GGUF model | ✅ |
| 🦙 Ollama | Local | Easy local LLM | ✅ |
| 🌐 OpenRouter | Cloud | Free tier available | ✅ |
| 🔑 OpenAI | Cloud | GPT-4o, etc. | ❌ |
| ⚡ Groq | Cloud | Ultra-fast | ✅ |
| ⚙️ Custom | Any | Any OpenAI-compatible API | - |

## 🛠️ Available Tools (22)

The AI can use these tools automatically:

**File:** `read_file` `write_file` `edit_file` `append_file` `insert_at_line` `read_lines` `delete_file` `move_file` `copy_file` `file_info`

**Directory:** `list_directory` `create_directory` `tree`

**Search:** `search_files` `grep` `find_replace`

**Commands:** `run_command`

**Git:** `git_status` `git_diff` `git_log` `git_commit`

**Web:** `web_fetch`

## 📖 Commands

```bash
mylocalcli              # Start chat
mylocalcli init         # Setup wizard
mylocalcli config       # View/edit config
mylocalcli models       # List models
mylocalcli providers    # List providers
mylocalcli history      # Manage conversations
mylocalcli web          # Start web UI (localhost:3456)
```

### Chat Commands

`/help` `/tools` `/clear` `/history` `/exit`

## 🦙 Ollama Setup

```bash
ollama pull llama3.2
ollama serve
mylocalcli init  # Select Ollama
```

## 🏠 LM Studio Setup

1. Download [LM Studio](https://lmstudio.ai)
2. Load a model → Start Server (port 1234)
3. Run `mylocalcli init` → Select LM Studio

## 🌐 Web UI

```bash
mylocalcli web
```

Features: Dark theme, voice input, conversation history

## 📄 License

MIT - Use it, modify it, make it yours!

---

⭐ **Star this repo if you find it useful!**
