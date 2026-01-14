// MyLocalCLI - Subagents System
// Specialized agents that can be invoked with @mentions

import { printInfo, printSuccess, colors } from '../ui/terminal.js';

/**
 * Built-in subagents
 */
export const SUBAGENTS = {
    oracle: {
        name: 'oracle',
        trigger: '@oracle',
        description: 'Complex multi-step searches and analysis',
        icon: '🔮',
        systemPrompt: `You are Oracle, a specialized subagent for complex searches and multi-step analysis.

Your capabilities:
1. Deep codebase searches across multiple files
2. Pattern recognition across the project
3. Multi-step dependency tracing
4. Complex query decomposition

When invoked:
1. Break down the search into logical steps
2. Use available tools systematically
3. Synthesize findings into a clear summary
4. Highlight important patterns and connections

Be thorough but efficient. Focus on actionable insights.`,
        tools: ['read_file', 'grep', 'codebase_search', 'list_directory', 'tree']
    },

    librarian: {
        name: 'librarian',
        trigger: '@librarian',
        description: 'Code exploration and documentation expert',
        icon: '📚',
        systemPrompt: `You are Librarian, a specialized subagent for code exploration and documentation.

Your capabilities:
1. Understanding code architecture
2. Explaining complex code in simple terms
3. Mapping relationships between components
4. Creating documentation and summaries

When invoked:
1. Explore the relevant code thoroughly
2. Understand the context and purpose
3. Explain clearly with examples
4. Create visual representations when helpful (ASCII diagrams)

Be educational and clear. Assume the user wants to understand, not just get an answer.`,
        tools: ['read_file', 'list_directory', 'tree', 'codebase_search', 'grep']
    },

    reviewer: {
        name: 'reviewer',
        trigger: '@reviewer',
        description: 'Automatic code review on changes',
        icon: '👀',
        systemPrompt: `You are Reviewer, a specialized subagent for code review.

Your capabilities:
1. Reviewing code changes for bugs and issues
2. Checking for security vulnerabilities
3. Suggesting performance improvements
4. Ensuring code follows best practices

When invoked:
1. Check git status/diff for recent changes
2. Review each changed file carefully
3. Identify potential issues by severity
4. Suggest specific improvements

Format your review as:
## Summary
Brief overview

## 🔴 Critical Issues
Must fix before merge

## 🟡 Warnings
Should consider fixing

## 🟢 Suggestions
Nice to have improvements`,
        tools: ['read_file', 'git_status', 'git_diff', 'grep', 'codebase_search']
    }
};

/**
 * Detect subagent mentions in input
 */
export function detectSubagentMention(input) {
    for (const [name, agent] of Object.entries(SUBAGENTS)) {
        if (input.includes(agent.trigger)) {
            const query = input.replace(agent.trigger, '').trim();
            return { agent, query };
        }
    }
    return null;
}

/**
 * Get subagent by name
 */
export function getSubagent(name) {
    return SUBAGENTS[name.toLowerCase()] || null;
}

/**
 * Get all subagents
 */
export function getAllSubagents() {
    return Object.values(SUBAGENTS);
}

/**
 * Create context for subagent execution
 */
export function createSubagentContext(agent, query, ctx) {
    return {
        agent,
        query,
        systemPrompt: `${agent.systemPrompt}

---

User query: ${query}

Working directory: ${ctx.cwd}

Use only these tools: ${agent.tools.join(', ')}`,
        tools: agent.tools,
        parentContext: ctx
    };
}

/**
 * Print subagents list
 */
export function printSubagentsList() {
    console.log(`\n${colors.primary('━━━ Available Subagents ━━━')}\n`);

    for (const agent of getAllSubagents()) {
        console.log(`  ${agent.icon} ${colors.secondary(agent.trigger)}`);
        console.log(`     ${colors.muted(agent.description)}`);
        console.log();
    }

    console.log(colors.muted('  Use @agent-name in your message to invoke a subagent.'));
    console.log(colors.muted('  Example: @oracle find all API endpoints'));
    console.log();
}

export default {
    SUBAGENTS,
    detectSubagentMention,
    getSubagent,
    getAllSubagents,
    createSubagentContext,
    printSubagentsList
};
