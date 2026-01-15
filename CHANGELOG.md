# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.4.1] - 2026-01-16

### Added - TUI Enhancements

- **Welcome Tips** - Random helpful tip shown on startup
- **Context Window Indicator** - Visual progress bar showing token usage `⟨████░░░░⟩ 32%`
- **Input History** - Commands saved for future recall
- **Progress Bar** - Visual progress indicator component
- **Terminal Title** - Shows "MyLocalCLI" in window title
- **Resize Handler** - Screen redraws properly when terminal is resized

### Changed
- Improved title bar with context indicator bar
- Better positioning of welcome screen elements

---

## [3.4.0] - 2026-01-16

### Added - Premium OpenCode-Style TUI

- **Full-Screen TUI** - Alternate screen buffer for clean experience
- **Beautiful ASCII Logo** - Gradient colors with purple-to-cyan effect
- **Rounded Unicode Boxes** - Premium `╭─╯` style borders
- **Syntax Highlighting** - Code blocks with keyword/string coloring
- **Animated Thinking** - Braille spinner animation while AI processes
- **Token Counter** - Live token usage with percentage in title bar
- **Professional Theme** - Modern dark theme with RGB color palette
- **Markdown Rendering** - Headers, bullets, and code blocks styled

### Changed
- TUI is now the default interface (use `--classic` for terminal mode)
- Improved status bar with mode icons and keyboard hints
- Better error handling and provider detection

---

## [3.3.0] - 2026-01-14

### Added - OpenCode & AmpCode Inspired Features

#### Agent Modes (OpenCode-inspired)
- **BUILD mode** 🔨 - Full access mode for active development
- **PLAN mode** 📋 - Read-only mode for safe exploration and code review
- Type `tab` to toggle between modes instantly
- Mode indicator in prompt: `[BUILD] You:` or `[PLAN] You:`
- Automatic tool blocking in PLAN mode (prevents accidental modifications)

#### Performance Modes (AmpCode-inspired)
- **SMART mode** 🧠 - Maximum capability with best model
- **RUSH mode** ⚡ - Fast and efficient for quick tasks

#### Shell Mode (AmpCode-inspired)
- `$ <cmd>` - Execute shell command, output added to AI context
- `$$ <cmd>` - Incognito mode, output NOT added to context
- Perfect for quick commands without asking the AI

#### Context Pinning
- `/pin <file>` - Pin a file to always include in AI context
- `/unpin <file>` - Remove from pinned files
- `/pins` - List all pinned files

#### Session Branching
- `/branch <name>` - Create a conversation branch
- `/branches` - List all branches
- `/checkout <name>` - Switch to a branch

#### Project Templates
- `/init <template>` - Initialize project with predefined config
- Templates: react, python-api, node, nextjs, express

#### Custom Skills
- `/skill create <name>` - Create custom skill with wizard
- `/skill search <query>` - Search skills by keyword

#### Subagents
- `@oracle` - Complex multi-step searches
- `@librarian` - Code exploration and documentation
- `@reviewer` - Automatic code review

#### Mode Commands
- `/mode`, `/build`, `/plan`, `/smart`, `/rush`, `/shortcuts`

### Changed
- Updated `/help` command with all new features
- Enhanced keyboard shortcuts help

### Documentation
- New "Modes & Shell" documentation page on website
- Updated sidebar navigation

---


## [3.2.0] - 2024-12-26

### Added
- **Privacy Warning** for cloud providers (OpenRouter, Groq, OpenAI)
- vLLM self-hosting guide for full privacy with cloud-grade performance
- Quick start links table for all providers with privacy indicators

### Changed
- Enhanced "Privacy & Security" section in README with detailed warnings
- Made privacy implications clearer for new users

---

## [3.1.0] - 2024-12-26

### Added
- **22 modular skills** - Each skill now has its own `SKILL.md` file in `src/skills/builtin/`
- Vitest testing framework with 29 tests (executor, skills, files)
- ESLint and Prettier for code quality
- GitHub Actions CI/CD workflows (lint, test on 3 OS, npm publish)
- Comprehensive documentation in `docs/` folder
- CONTRIBUTING.md guide for contributors
- CHANGELOG.md for version history
- GitHub issue templates

### Changed
- Skills system refactored to modular files (Claude Code style)
- Cross-platform command translation (Unix commands work on Windows)
- Improved error messages and handling

### Fixed
- Windows path handling in skills loader
- Gradient overlay blocking button clicks on website

---

## [3.0.1] - 2024-12-22

### Added
- 22 built-in skills for languages, frameworks, databases, and DevOps
- Cross-platform command support (ls→dir on Windows)
- Project configuration via MYLOCALCLI.md
- 5 specialized agents (code-reviewer, explorer, test-generator, refactorer, doc-writer)
- 26 tools for file operations, search, git, and more

### Changed
- Improved edit_file with fuzzy matching for whitespace differences
- Better line ending handling (CRLF/LF)

### Fixed
- Windows path handling in skills loader
- Command execution on Windows

---

## [3.0.0] - 2024-12-20

### Added
- Complete rewrite with modular architecture
- Skills system with auto-injection
- Agents system for specialized tasks
- Plugin hooks support
- Web UI with dark theme
- Voice input support

### Changed
- Switched to ES modules
- New terminal UI with streaming

---

## [2.0.0] - 2024-12-15

### Added
- Multiple provider support (LM Studio, Ollama, OpenRouter, Groq, OpenAI)
- Tool system with file operations
- Git integration

### Changed
- New configuration system

---

## [1.0.0] - 2024-12-10

### Added
- Initial release
- Basic chat with LM Studio
- Simple file operations
