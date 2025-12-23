// MyLocalCLI - Agent System
// Specialized sub-agents inspired by Claude Code

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { printInfo, printSuccess, printWarning, colors } from '../ui/terminal.js';

/**
 * Agent definition structure
 * @typedef {Object} Agent
 * @property {string} name - Agent name
 * @property {string} description - What this agent does
 * @property {string} prompt - System prompt for the agent
 * @property {string[]} tools - Allowed tools for this agent
 * @property {string} model - Model to use ('inherit' = use current)
 * @property {string} color - Display color
 */

// Registry of available agents
const AGENTS = new Map();

// Built-in agents
const BUILTIN_AGENTS = [
    {
        name: 'code-reviewer',
        description: 'Reviews code for bugs, security issues, and best practices',
        color: 'yellow',
        tools: ['read_file', 'list_directory', 'grep', 'codebase_search'],
        prompt: `You are a code review specialist. Your job is to:

1. **Find Bugs**: Look for logic errors, off-by-one errors, null pointer issues
2. **Security Issues**: Identify SQL injection, XSS, hardcoded secrets, unsafe eval
3. **Best Practices**: Check code style, naming conventions, documentation
4. **Performance**: Spot inefficient algorithms, memory leaks, N+1 queries

Format your review as:
## Summary
Brief overview of findings

## Critical Issues
- Issue 1: [file:line] Description

## Warnings  
- Warning 1: [file:line] Description

## Suggestions
- Suggestion 1: Description

Be specific with file names and line numbers. Be constructive, not harsh.`
    },
    {
        name: 'code-explorer',
        description: 'Deep codebase analysis to understand architecture and patterns',
        color: 'cyan',
        tools: ['read_file', 'list_directory', 'tree', 'grep', 'codebase_search', 'file_info'],
        prompt: `You are a codebase exploration specialist. Your job is to:

1. **Map the Architecture**: Identify main components, layers, and their relationships
2. **Find Patterns**: Recognize design patterns, coding conventions, abstractions
3. **Trace Data Flow**: Follow how data moves through the system
4. **Identify Key Files**: Find entry points, core modules, configuration

Format your analysis as:
## Architecture Overview
High-level structure of the codebase

## Key Components
- Component 1: Purpose and location
- Component 2: Purpose and location

## Design Patterns
- Pattern 1: Where and how it's used

## Entry Points
- Main entry: path/to/file

## Recommendations
Suggestions for understanding the codebase better.`
    },
    {
        name: 'test-generator',
        description: 'Generates unit tests and test cases for code',
        color: 'green',
        tools: ['read_file', 'write_file', 'list_directory', 'grep'],
        prompt: `You are a test generation specialist. Your job is to:

1. **Analyze Code**: Understand the functions and their expected behavior
2. **Identify Edge Cases**: Think about boundary conditions, error cases
3. **Write Tests**: Create comprehensive unit tests
4. **Follow Conventions**: Match the project's existing test style

When generating tests:
- Use the project's existing test framework (Jest, Mocha, pytest, etc.)
- Cover happy path, error cases, and edge cases
- Use descriptive test names
- Mock external dependencies appropriately
- Aim for high code coverage

Ask the user which file or function they want tests for if not specified.`
    },
    {
        name: 'refactorer',
        description: 'Suggests and implements code refactoring improvements',
        color: 'magenta',
        tools: ['read_file', 'edit_file', 'multi_edit_file', 'grep', 'codebase_search'],
        prompt: `You are a code refactoring specialist. Your job is to:

1. **Identify Smells**: Find code duplication, long functions, deep nesting
2. **Suggest Improvements**: Propose cleaner, more maintainable alternatives
3. **Preserve Behavior**: Ensure refactoring doesn't change functionality
4. **Apply Changes**: Make the edits when approved

Common refactoring patterns:
- Extract method/function
- Rename for clarity
- Remove duplication (DRY)
- Simplify conditionals
- Break down large functions
- Improve naming
- Add/improve documentation

Always explain WHY a refactoring improves the code before making changes.`
    },
    {
        name: 'doc-writer',
        description: 'Generates documentation, READMEs, and code comments',
        color: 'blue',
        tools: ['read_file', 'write_file', 'edit_file', 'list_directory', 'tree'],
        prompt: `You are a documentation specialist. Your job is to:

1. **Understand Code**: Read and comprehend what the code does
2. **Write Clear Docs**: Create documentation that helps others understand
3. **Follow Standards**: Use appropriate formats (JSDoc, docstrings, markdown)
4. **Be Concise**: Don't over-document obvious things

Types of documentation you create:
- README.md files
- API documentation
- Code comments and docstrings
- Usage examples
- Architecture docs

Good documentation answers: What does it do? How do I use it? Why was it built this way?`
    }
];

/**
 * Initialize built-in agents
 */
export function initializeBuiltinAgents() {
    for (const agent of BUILTIN_AGENTS) {
        AGENTS.set(agent.name, agent);
    }
}

/**
 * Register an agent
 */
export function registerAgent(agent) {
    AGENTS.set(agent.name, agent);
}

/**
 * Get an agent by name
 */
export function getAgent(name) {
    return AGENTS.get(name);
}

/**
 * Get all registered agents
 */
export function getAllAgents() {
    return Array.from(AGENTS.values());
}

/**
 * Load agents from markdown files
 * Looks in:
 * - ~/.mylocalcli/agents/
 * - .mylocalcli/agents/
 */
export async function loadAgents(cwd) {
    // Initialize built-in agents first
    initializeBuiltinAgents();

    const locations = [
        path.join(os.homedir(), '.mylocalcli', 'agents'),
        path.join(cwd, '.mylocalcli', 'agents')
    ];

    for (const dir of locations) {
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = path.join(dir, file);
                    const agent = await parseAgentFile(filePath);
                    if (agent) {
                        registerAgent(agent);
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist - that's fine
        }
    }

    return getAllAgents();
}

/**
 * Parse an agent markdown file
 */
export async function parseAgentFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        const meta = {};
        let body = content;

        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            body = content.slice(frontmatterMatch[0].length).trim();

            for (const line of frontmatter.split('\n')) {
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    const key = line.slice(0, colonIdx).trim();
                    let value = line.slice(colonIdx + 1).trim();

                    // Remove quotes
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    // Parse arrays
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            // Keep as string
                        }
                    }

                    meta[key] = value;
                }
            }
        }

        return {
            name: meta.name || path.basename(filePath, '.md'),
            description: meta.description || '',
            model: meta.model || 'inherit',
            tools: meta.tools || [],
            color: meta.color || 'cyan',
            prompt: body,
            source: filePath
        };
    } catch (error) {
        console.error(`Failed to parse agent file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Create an agent context for execution
 * @param {string} agentName - Name of the agent to create
 * @param {string} task - Task description for the agent
 * @param {Object} ctx - Parent context
 */
export function createAgentContext(agentName, task, ctx) {
    const agent = getAgent(agentName);
    if (!agent) {
        return null;
    }

    // Build agent system prompt
    const systemPrompt = `${agent.prompt}

---

You are the "${agent.name}" agent. Your task is:

${task}

---

Working directory: ${ctx.cwd}

Use only the tools available to you: ${agent.tools.join(', ')}`;

    return {
        agent,
        systemPrompt,
        task,
        tools: agent.tools,
        messages: [],
        parentContext: ctx
    };
}

/**
 * Print agent list
 */
export function printAgentsList() {
    console.log('\n' + colors.primary('━━━ Available Agents ━━━') + '\n');

    const agents = getAllAgents();

    if (agents.length === 0) {
        console.log('  ' + colors.muted('No agents available'));
        return;
    }

    // Color mapping for agent colors (uses chalk directly)
    const colorMap = {
        yellow: (t) => `\x1b[33m${t}\x1b[0m`,
        cyan: (t) => `\x1b[36m${t}\x1b[0m`,
        green: (t) => `\x1b[32m${t}\x1b[0m`,
        magenta: (t) => `\x1b[35m${t}\x1b[0m`,
        blue: (t) => `\x1b[34m${t}\x1b[0m`,
        red: (t) => `\x1b[31m${t}\x1b[0m`
    };

    for (const agent of agents) {
        const colorFn = colorMap[agent.color] || colorMap.cyan;
        console.log(`  ${colorFn('●')} ${colors.primary(agent.name)}`);
        console.log(`    ${colors.muted(agent.description)}`);
        console.log(`    ${colors.muted('Tools:')} ${agent.tools.slice(0, 5).join(', ')}${agent.tools.length > 5 ? '...' : ''}`);
        console.log();
    }

    console.log(colors.muted('  Use /agent <name> <task> to invoke an agent'));
    console.log();
}

// Initialize built-in agents on module load
initializeBuiltinAgents();

export default {
    initializeBuiltinAgents,
    registerAgent,
    getAgent,
    getAllAgents,
    loadAgents,
    parseAgentFile,
    createAgentContext,
    printAgentsList,
    BUILTIN_AGENTS
};
