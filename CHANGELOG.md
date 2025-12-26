# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
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
