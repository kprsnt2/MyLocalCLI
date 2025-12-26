# Agents Guide

Agents are specialized AI personas designed for specific tasks. They have focused prompts and behaviors.

## Available Agents (5)

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

## Custom Agents (Coming Soon)

Future versions will support custom agent definitions in:
- `.mylocalcli/agents/<name>.md`
