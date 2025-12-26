# Getting Started with MyLocalCLI

This guide will help you set up MyLocalCLI and start using it in under 5 minutes.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **One of these AI providers:**
  - LM Studio (local, private)
  - Ollama (local, private)
  - OpenRouter (cloud, free tier)
  - Groq (cloud, free tier)
  - OpenAI (cloud, paid)

## Installation

```bash
npm install -g mylocalcli
```

Verify installation:

```bash
mlc --version
```

## Setup Wizard

Run the setup wizard:

```bash
mlc init
```

The wizard will guide you through:
1. **Choosing a provider** - Local (LM Studio, Ollama) or Cloud (OpenRouter, Groq)
2. **Configuring connection** - API endpoints and keys
3. **Selecting a model** - Pick from available models

## Quick Provider Setup

### Option 1: LM Studio (Recommended for Privacy)

1. Download [LM Studio](https://lmstudio.ai)
2. Open LM Studio → Search for a model (e.g., "Qwen 2.5 Coder 7B")
3. Download the model → Load it
4. Click "Local Server" → Start Server
5. Run `mlc init` → Select "LM Studio"

### Option 2: Ollama (Lightweight)

```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2
ollama serve
mlc init  # Select Ollama
```

### Option 3: OpenRouter (Free Cloud)

1. Get a free API key from [openrouter.ai](https://openrouter.ai)
2. Run `mlc init` → Select "OpenRouter"
3. Enter your API key

### Option 4: Groq (Fastest Cloud)

1. Get a free API key from [console.groq.com](https://console.groq.com)
2. Run `mlc init` → Select "Groq"
3. Enter your API key

## Your First Chat

Start the CLI:

```bash
mlc
```

Try these commands:

```
You: Hello! What can you do?
You: /help
You: /tools
You: Show me my project structure
You: Read the package.json file
```

## Understanding the Interface

```
┌─────────────────────────────────────┐
│  MyLocalCLI v3.0.1                  │
│  Provider: lmstudio                 │
│  Model: qwen2.5-coder-7b            │
│  Context: 15% (4096/32768 tokens)   │
└─────────────────────────────────────┘

You: your message here
```

## Essential Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/tools` | List available tools |
| `/skills` | List auto-injected skills |
| `/clear` | Clear conversation history |
| `/exit` | Exit the chat |

## Next Steps

- **[Tools Guide](./tools.md)** - Learn about the 26 available tools
- **[Skills Guide](./skills.md)** - Understand auto-injected best practices
- **[Agents Guide](./agents.md)** - Use specialized AI agents
- **[Configuration Guide](./configuration.md)** - Advanced setup options

## Troubleshooting

### "Connection refused"
- Make sure your local server (LM Studio/Ollama) is running
- Check the port: LM Studio uses 1234, Ollama uses 11434

### Slow responses
- Try a smaller model
- Use Groq for fastest cloud responses
- Clear context with `/clear`

### Windows command errors
- Unix commands (ls, cat, rm) are auto-translated
- The CLI handles this automatically

## Getting Help

- Type `/help` in the chat
- Check the [README](../README.md)
- Open an issue on GitHub
