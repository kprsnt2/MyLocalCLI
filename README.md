# MyLocalCLI ⚡

**Your Own AI Coding Assistant - Private, Local, Yours**

A Claude Code alternative that works with **local LLMs** and free cloud APIs.

![MyLocalCLI](https://img.shields.io/badge/MyLocalCLI-v2.0.0-purple)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🏠 **6 AI Providers** - LM Studio, Ollama, OpenRouter, OpenAI, Groq, Custom
- 🛠️ **22 Tools** - File ops, search, git, web fetch (Claude Code style)
- 🌐 **Web UI** - Beautiful dark theme with voice input
- 💬 **Conversations** - Save, load, export chat history
- 🔒 **Private** - Runs locally, your data stays yours

## 🚀 Installation

### Option 1: From GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/kprsnt2/MyLocalCLI.git
cd MyLocalCLI

# Install dependencies
npm install

# Make it globally available
npm link

# Now you can use it from anywhere!
mylocalcli
```

### Option 2: Direct npm install from GitHub

```bash
npm install -g github:kprsnt2/MyLocalCLI
```

### Option 3: Run without installing

```bash
git clone https://github.com/kprsnt2/MyLocalCLI.git
cd MyLocalCLI
npm install
node src/index.js
```

## 🎯 Quick Start

```bash
# Setup wizard (first time)
mylocalcli init

# Start chatting (CLI)
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

**File Operations:** `read_file`, `write_file`, `edit_file`, `append_file`, `insert_at_line`, `read_lines`, `delete_file`, `move_file`, `copy_file`, `file_info`

**Directory:** `list_directory`, `create_directory`, `tree`

**Search:** `search_files`, `grep`, `find_replace`

**Commands:** `run_command`

**Git:** `git_status`, `git_diff`, `git_log`, `git_commit`

**Web:** `web_fetch`

## 📖 CLI Commands

```bash
mylocalcli              # Start chat
mylocalcli init         # Setup wizard
mylocalcli config       # View/edit config
mylocalcli models       # List models
mylocalcli providers    # List providers
mylocalcli history      # Manage conversations
mylocalcli web          # Start web UI
```

### Chat Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help |
| `/tools` | List available tools |
| `/clear` | Clear conversation |
| `/history` | List saved chats |
| `/exit` | Exit |

## 🦙 Using with Ollama

```bash
# Install Ollama (https://ollama.ai)
ollama pull llama3.2
ollama serve

# Configure MyLocalCLI
mylocalcli init
# Select "Ollama"
```

## 🏠 Using with LM Studio

1. Download [LM Studio](https://lmstudio.ai)
2. Load a model (e.g., Llama 3, CodeLlama)
3. Click "Start Server" (port 1234)
4. Run `mylocalcli init` → Select "LM Studio"

## 🌐 Web UI

```bash
mylocalcli web
# Opens http://localhost:3456
```

Features:
- 🎨 Dark theme
- 🎤 Voice input (Chrome/Edge)
- 💬 Conversation history
- ⚙️ Provider switching

## 📁 Project Structure

```
MyLocalCLI/
├── package.json
├── src/
│   ├── index.js         # CLI entry
│   ├── config/          # Settings
│   ├── core/            # Chat, tools
│   ├── providers/       # LLM providers
│   ├── ui/              # Terminal UI
│   └── utils/           # Utilities
└── web/
    └── index.html       # Web UI
```

## 🔧 Configuration

Config stored in: `~/.config/mylocalcli/`

Environment variables:
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `GROQ_API_KEY`

## 📄 License

MIT License - Use it, modify it, make it yours!

---

**Made with ❤️ for developers who want AI coding without the cloud**

⭐ Star this repo if you find it useful!
