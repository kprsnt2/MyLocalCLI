# Contributing to MyLocalCLI

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/kprsnt2/MyLocalCLI.git
cd MyLocalCLI

# Install dependencies
npm install

# Run the CLI locally
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code improvements

### 2. Make Changes

- Follow the existing code style
- Add tests for new features
- Update docs if needed

### 3. Test Your Changes

```bash
npm test              # Run tests
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format code with Prettier
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new Python skill"
git commit -m "fix: handle Windows paths correctly"
git commit -m "docs: update installation guide"
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### 5. Submit a Pull Request

1. Push to your fork
2. Open a PR against `main`
3. Fill out the PR template
4. Wait for review

## Project Structure

```
MyLocalCLI/
├── src/
│   ├── index.js          # CLI entry point
│   ├── core/             # Core modules
│   │   ├── chat.js       # Chat handling
│   │   ├── executor.js   # Command execution
│   │   └── tools.js      # Tool definitions
│   ├── skills/           # Skills system
│   │   ├── skill.js      # Skill loader
│   │   └── builtin/      # Built-in skills
│   ├── providers/        # AI providers
│   ├── ui/               # Terminal UI
│   └── utils/            # Utilities
├── tests/                # Test files
├── docs/                 # Documentation
└── .github/workflows/    # CI/CD
```

## Adding a New Skill

1. Create a folder: `src/skills/builtin/<skill-name>/`
2. Create `SKILL.md` with frontmatter:

```markdown
---
name: my-skill
description: Description of the skill
globs: ["**/*.ext"]
priority: 50
tags: ["category"]
---

# Skill Content

- Best practice 1
- Best practice 2
```

3. Test with: `npm test`

## Adding a New Tool

1. Add the tool definition to `src/core/tools.js` in the `TOOLS` array
2. Add the implementation in `executeTool()` function
3. Add tests in `tests/tools.test.js`

## Adding a New Provider

1. Create `src/providers/<provider-name>.js`
2. Implement the provider interface
3. Register in `src/config/providers.js`
4. Add documentation

## Code Style

- Use ES modules (`import`/`export`)
- Use `async`/`await` for async code
- Use meaningful variable names
- Add JSDoc comments for public functions
- Keep functions small and focused

## Questions?

- Open an issue for questions
- Join discussions on GitHub

## License

By contributing, you agree that your contributions will be licensed under MIT.
