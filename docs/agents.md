# Agents Guide & Background Runtimes

Agents are specialized AI personas designed for specific tasks. They have focused prompts and behaviors.

As of **v4.0.2**, MyLocalCLI implements powerful **Background Runtimes** and headless LLM orchestrators that mirror Claw-Code and Gemini's architecture.

## 🧠 Background Runtimes (v4.0)

MyLocalCLI now features non-blocking, headless LLMs traversing your codebase behind the scenes. 

- **Task Registry & `workerAgent`**: Complex task execution is decoupled from your standard UI session via `src/core/taskRegistry.js`. Background loops run tasks quietly while you continue to build using persistent local json ledgers.
- **Team Crons**: Agents can be set up in `teamCronRegistry.js` to trigger automatically via `setInterval`. You can easily have an agent poll for syntax errors every 60 seconds without freezing your interface.

## Available Built-in Agents (5)

### 1. code-reviewer

**Purpose:** Reviews code for bugs, security issues, and style problems.

**Usage:**
```
/agent code-reviewer Review the authentication module
/agent code-reviewer Check src/api/users.js for security issues
```

**What it checks:**
- Security vulnerabilities
- Bug patterns
- Code style and formatting
- Performance issues
- Test coverage gaps

### 2. code-explorer

**Purpose:** Deep analysis of codebases to understand architecture and patterns.

**Usage:**
```
/agent code-explorer How does the authentication flow work?
/agent code-explorer Explain the data flow in this project
```

**What it does:**
- Maps code relationships
- Identifies design patterns
- Documents implicit behaviors
- Creates architecture overviews

### 3. test-generator

**Purpose:** Creates unit tests for your code.

**Usage:**
```
/agent test-generator Create tests for src/utils/validation.js
/agent test-generator Write integration tests for the user API
```

**Capabilities:**
- Unit tests (Jest, Vitest, pytest)
- Integration tests
- Edge case coverage
- Mock generation

### 4. refactorer

**Purpose:** Suggests and implements code improvements.

**Usage:**
```
/agent refactorer Improve the User class
/agent refactorer Make this function more readable
```

**Improvements it suggests:**
- Extract functions
- Reduce complexity
- Apply design patterns
- Remove code duplication

### 5. doc-writer

**Purpose:** Generates documentation for code.

**Usage:**
```
/agent doc-writer Document the API endpoints
/agent doc-writer Create JSDoc for src/services/
```

**Documentation types:**
- API documentation
- JSDoc/TSDoc comments
- README files
- Usage examples

## Using Agents

### Syntax

```
/agent <agent-name> <your request>
```

### Examples

```bash
# Review a specific file
/agent code-reviewer Review src/auth/login.js

# Understand project structure  
/agent code-explorer Map out the project architecture

# Generate tests
/agent test-generator Write tests for the validation module

# Improve code
/agent refactorer Simplify the handleSubmit function

# Create docs
/agent doc-writer Document all exported functions in src/utils/
```

### Viewing Agents

```bash
mlc
> /agents
```

## Agent Differences

| Agent | Focus | Output Style |
|-------|-------|--------------|
| code-reviewer | Finding issues | Bullet points with severity |
| code-explorer | Understanding | Explanatory with diagrams |
| test-generator | Creating tests | Test code ready to run |
| refactorer | Improving code | Before/after comparisons |
| doc-writer | Documentation | Formatted docs |

## Tips

1. **Be specific**: "Review auth.js for SQL injection" vs "Review code"
2. **Provide context**: Tell the agent about your codebase
3. **Chain agents**: Use explorer first, then reviewer
4. **Combine with tools**: Agents can use all 26 tools

## Custom Agents & Background Tasks

You can natively add autonomous task workers and background crons using the persistent JSON ledgers:
- `.mylocalcli/tasks.json`
- `.mylocalcli/crons.json`
