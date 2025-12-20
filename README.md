# MyLocalCLI ⚡

**Your Own AI Coding Assistant - Private, Local, Yours**

![MyLocalCLI](https://img.shields.io/badge/MyLocalCLI-v2.0.0-purple)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🤖 Multi-Provider Support
| Provider | Type | Description |
|----------|------|-------------|
| 🏠 **LM Studio** | Local | Connect to your local LLM |
| 🦙 **Ollama** | Local | Another popular local option |
| 🌐 **OpenRouter** | Cloud | Free models (Llama 3.3, Gemma, etc.) |
| 🔑 **OpenAI** | Cloud | GPT-4o, GPT-4, etc. |
| ⚡ **Groq** | Cloud | Ultra-fast inference |
| ⚙️ **Custom** | Any | Any OpenAI-compatible API |

### 🛠️ Tool Calling
- **Read/Write Files** - AI can read and modify files
- **Execute Commands** - Run shell commands safely
- **Git Integration** - Status, diff, and more

### 💬 Conversation Management
- Save & load conversations
- Export to Markdown
- Named sessions

### 🌐 Web UI
- Beautiful dark theme
- Voice input (Chrome/Edge)
- Provider switching

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup wizard
node src/index.js init

# Start CLI chat
node src/index.js

# Start Web UI
node src/index.js web
```

After `npm link`, you can use:
```bash
mylocalcli      # CLI mode
mlc             # Short alias
mylocalcli web  # Web UI
```

## 📖 Commands

### CLI
```bash
mylocalcli                    # Start chat
mylocalcli init               # Setup wizard
mylocalcli config --show      # View config
mylocalcli models             # List models
mylocalcli providers          # List providers
mylocalcli web                # Start web UI
mylocalcli history --list     # List conversations
```

### In-Chat Commands
| Command | Description |
|---------|-------------|
| `/help` | Show help |
| `/clear` | Clear conversation |
| `/models` | List models |
| `/exit` | Exit |

## 🦙 Ollama Setup

```bash
ollama pull llama3.2
ollama serve
mylocalcli config --provider ollama
```

## 🏠 LM Studio Setup

1. Download [LM Studio](https://lmstudio.ai)
2. Load a model
3. Start the server (port 1234)
4. Run `mylocalcli init`

## 🌐 OpenRouter (Free Models)

1. Get API key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Run `mylocalcli init` and select OpenRouter

## 📁 Project Structure

```
mylocalcli/
├── package.json
├── src/
│   ├── index.js          # CLI entry
│   ├── config/           # Settings
│   ├── providers/        # LLM providers
│   ├── core/             # Chat, tools
│   ├── ui/               # Terminal UI
│   └── utils/            # Utilities
└── web/
    └── index.html        # Web UI
```

## 📄 License

MIT License

---

**MyLocalCLI** - Your Own AI Coding Assistant 🚀
