// MyLocalCLI - Slash Commands System
// Inspired by Claude Code plugin commands

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { printInfo, printError, printSuccess, printWarning, colors } from '../ui/terminal.js';
import { getAllAgents, getAgent, printAgentsList, createAgentContext, loadAgents } from '../agents/agent.js';
import { getAllSkills, printSkillsList, loadSkills, getSkillContext } from '../skills/skill.js';
import {
    getAgentMode,
    setAgentMode,
    toggleAgentMode,
    getPerformanceMode,
    setPerformanceMode,
    togglePerformanceMode,
    printModeStatus,
    getModeSwitchMessage,
    AGENT_MODES,
    PERFORMANCE_MODES
} from './modes.js';
import { pinFile, unpinFile, getPinnedFiles, printPinnedFiles, clearPinnedFiles } from './pinning.js';
import { createBranch, listBranches, loadBranch, printBranchesList, setCurrentBranch, getCurrentBranch } from './branching.js';
import { detectSubagentMention, getSubagent, getAllSubagents, createSubagentContext, printSubagentsList } from './subagents.js';
import { initializeProject, getTemplate, getAllTemplates, printTemplatesList } from './templates.js';
import { createSkillTemplate, searchSkills } from '../skills/skill.js';

// Built-in commands registry
const BUILTIN_COMMANDS = new Map();

// User/plugin commands registry
const CUSTOM_COMMANDS = new Map();

/**
 * Command definition structure
 * @typedef {Object} Command
 * @property {string} name - Command name (without /)
 * @property {string} description - Command description
 * @property {string[]} [aliases] - Alternative names
 * @property {string[]} [allowedTools] - Restrict tools for this command
 * @property {string} [argumentHint] - Hint for arguments
 * @property {Function} handler - Async function(args, ctx) => result
 */

/**
 * Register a built-in command
 */
export function registerCommand(command) {
    BUILTIN_COMMANDS.set(command.name, command);
    if (command.aliases) {
        for (const alias of command.aliases) {
            BUILTIN_COMMANDS.set(alias, command);
        }
    }
}

/**
 * Register a custom command (from plugins or user)
 */
export function registerCustomCommand(command) {
    CUSTOM_COMMANDS.set(command.name, command);
    if (command.aliases) {
        for (const alias of command.aliases) {
            CUSTOM_COMMANDS.set(alias, command);
        }
    }
}

/**
 * Get a command by name
 */
export function getCommand(name) {
    return CUSTOM_COMMANDS.get(name) || BUILTIN_COMMANDS.get(name);
}

/**
 * Get all registered commands
 */
export function getAllCommands() {
    const commands = new Map([...BUILTIN_COMMANDS, ...CUSTOM_COMMANDS]);
    // Dedupe by filtering aliases (only show main command name)
    const unique = [];
    const seen = new Set();
    for (const [name, cmd] of commands) {
        if (!seen.has(cmd.name)) {
            unique.push(cmd);
            seen.add(cmd.name);
        }
    }
    return unique;
}

/**
 * Parse a slash command input
 * @returns {{ command: string, args: string[], raw: string }}
 */
export function parseCommand(input) {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
        return null;
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const raw = parts.slice(1).join(' ');

    return { command, args, raw };
}

/**
 * Execute a slash command
 * @returns {Promise<{handled: boolean, result?: any, exit?: boolean}>}
 */
export async function executeCommand(input, ctx) {
    const parsed = parseCommand(input);
    if (!parsed) {
        return { handled: false };
    }

    const { command, args, raw } = parsed;
    const cmd = getCommand(command);

    if (!cmd) {
        printError(`Unknown command: /${command}`);
        printInfo('Type /help for available commands');
        return { handled: true };
    }

    try {
        const result = await cmd.handler(args, raw, ctx);
        return { handled: true, result, exit: result === 'exit' };
    } catch (error) {
        printError(`Command failed: ${error.message}`);
        return { handled: true };
    }
}

/**
 * Load custom commands from markdown files
 * Looks in:
 * - ~/.mylocalcli/commands/
 * - .mylocalcli/commands/ (project-local)
 */
export async function loadCustomCommands(cwd) {
    const locations = [
        path.join(os.homedir(), '.mylocalcli', 'commands'),
        path.join(cwd, '.mylocalcli', 'commands')
    ];

    for (const dir of locations) {
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = path.join(dir, file);
                    const command = await parseCommandFile(filePath);
                    if (command) {
                        registerCustomCommand(command);
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist - that's fine
        }
    }
}

/**
 * Parse a markdown command file
 * Format:
 * ---
 * name: command-name
 * description: What this command does
 * argument-hint: <optional args>
 * allowed-tools: Read, Write, Bash
 * ---
 * 
 * Command instructions for the AI...
 */
export async function parseCommandFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        if (!frontmatterMatch) {
            // If no frontmatter, use filename as command name
            const name = path.basename(filePath, '.md');
            return {
                name,
                description: `Custom command: ${name}`,
                prompt: content,
                isPromptCommand: true,
                handler: createPromptHandler(content)
            };
        }

        const frontmatter = frontmatterMatch[1];
        const body = content.slice(frontmatterMatch[0].length).trim();

        // Parse YAML-like frontmatter
        const meta = {};
        for (const line of frontmatter.split('\n')) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const key = line.slice(0, colonIdx).trim();
                let value = line.slice(colonIdx + 1).trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                meta[key] = value;
            }
        }

        const name = meta.name || path.basename(filePath, '.md');
        const description = meta.description || `Custom command: ${name}`;
        const argumentHint = meta['argument-hint'] || '';
        const allowedTools = meta['allowed-tools']
            ? meta['allowed-tools'].split(',').map(t => t.trim())
            : null;

        return {
            name,
            description,
            argumentHint,
            allowedTools,
            prompt: body,
            isPromptCommand: true,
            source: filePath,
            handler: createPromptHandler(body, { allowedTools })
        };
    } catch (error) {
        console.error(`Failed to parse command file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Create a handler that injects the command prompt into the conversation
 */
function createPromptHandler(promptTemplate, options = {}) {
    return async (args, raw, ctx) => {
        // Replace $ARGUMENTS placeholder with actual arguments
        let prompt = promptTemplate.replace(/\$ARGUMENTS/g, raw || '');

        // If we have arguments, append them
        if (raw && !promptTemplate.includes('$ARGUMENTS')) {
            prompt = `${prompt}\n\nUser provided: ${raw}`;
        }

        // Return the prompt to be sent to the AI
        return {
            type: 'inject',
            prompt,
            allowedTools: options.allowedTools
        };
    };
}

// ========================================
// BUILT-IN COMMANDS
// ========================================

// /help - Show all commands
registerCommand({
    name: 'help',
    aliases: ['h', '?'],
    description: 'Show available commands',
    handler: async (args, raw, ctx) => {
        console.log('\n' + colors.primary('━━━ MyLocalCLI Commands ━━━') + '\n');

        console.log(colors.secondary('  MODES (OpenCode/AmpCode-inspired):'));
        console.log('    /mode           - Show current modes');
        console.log('    /build          - Switch to BUILD mode (full access)');
        console.log('    /plan           - Switch to PLAN mode (read-only)');
        console.log('    /smart          - Switch to SMART mode (max capability)');
        console.log('    /rush           - Switch to RUSH mode (fast)');

        console.log(colors.secondary('\n  SHELL MODE:'));
        console.log('    $ <cmd>         - Run shell command (output in AI context)');
        console.log('    $$ <cmd>        - Run shell command (incognito mode)');

        console.log(colors.secondary('\n  NAVIGATION:'));
        console.log('    /help, /h       - Show this help');
        console.log('    /exit, /quit    - Exit the chat');
        console.log('    /clear          - Clear conversation history');
        console.log('    /shortcuts      - Show all keyboard shortcuts');

        console.log(colors.secondary('\n  CONFIGURATION:'));
        console.log('    /config         - Show current configuration');
        console.log('    /providers      - List available providers');
        console.log('    /models         - List available models');

        console.log(colors.secondary('\n  TOOLS:'));
        console.log('    /tools          - List all available tools');

        console.log(colors.secondary('\n  HISTORY:'));
        console.log('    /history        - List saved conversations');
        console.log('    /load <id>      - Load a conversation');
        console.log('    /save <name>    - Rename current conversation');
        console.log('    /export         - Export as markdown');

        console.log(colors.secondary('\n  AGENTS:'));
        console.log('    /agents         - List available agents');
        console.log('    /agent <name>   - Use a specific agent');

        // Show custom commands if any
        const customCmds = [...CUSTOM_COMMANDS.values()].filter((v, i, a) =>
            a.findIndex(c => c.name === v.name) === i
        );
        if (customCmds.length > 0) {
            console.log(colors.secondary('\n  CUSTOM COMMANDS:'));
            for (const cmd of customCmds) {
                const hint = cmd.argumentHint ? ` ${cmd.argumentHint}` : '';
                console.log(`    /${cmd.name}${hint} - ${cmd.description}`);
            }
        }

        console.log();
        return null;
    }
});

// /exit - Exit the chat
registerCommand({
    name: 'exit',
    aliases: ['quit', 'q'],
    description: 'Exit the chat',
    handler: async () => 'exit'
});

// /clear - Clear conversation
registerCommand({
    name: 'clear',
    description: 'Clear conversation history',
    handler: async (args, raw, ctx) => {
        ctx.messages.length = 0;
        printSuccess('Conversation cleared');
        return null;
    }
});

// /config - Show configuration
registerCommand({
    name: 'config',
    description: 'Show current configuration',
    handler: async (args, raw, ctx) => {
        printInfo(`Provider: ${ctx.providerName}`);
        printInfo(`Model: ${ctx.model || 'default'}`);
        printInfo(`Working Directory: ${ctx.cwd}`);
        printInfo(`Session: ${ctx.sessionId?.slice(0, 8)}...`);
        return null;
    }
});

// /providers - List providers
registerCommand({
    name: 'providers',
    aliases: ['provider'],
    description: 'List available providers',
    handler: async (args, raw, ctx) => {
        if (ctx.printProvidersList && ctx.PROVIDERS) {
            ctx.printProvidersList(ctx.PROVIDERS, ctx.providerName);
        } else {
            printInfo('Available providers: lmstudio, ollama, openrouter, openai, groq, custom');
            printInfo(`Current: ${ctx.providerName}`);
        }
        return null;
    }
});

// /models - List models
registerCommand({
    name: 'models',
    description: 'List available models',
    handler: async (args, raw, ctx) => {
        if (ctx.provider && ctx.provider.listModels) {
            try {
                const models = await ctx.provider.listModels();
                if (ctx.printModelsList) {
                    ctx.printModelsList(models);
                } else {
                    console.log('\n' + colors.primary('Available Models:') + '\n');
                    for (const model of models.slice(0, 20)) {
                        console.log(`  ${model.id || model.name || model}`);
                    }
                    console.log();
                }
            } catch (error) {
                printError(`Failed to list models: ${error.message}`);
            }
        } else {
            printInfo('Model listing not available for this provider');
        }
        return null;
    }
});

// /tools - List available tools
registerCommand({
    name: 'tools',
    description: 'List available AI tools',
    handler: async (args, raw, ctx) => {
        console.log('\n' + colors.primary('━━━ Available Tools (26) ━━━') + '\n');

        console.log(colors.secondary('  FILE OPERATIONS (11):'));
        console.log('    read_file       - Read file contents');
        console.log('    write_file      - Create/overwrite a file');
        console.log('    edit_file       - Edit by replacing text');
        console.log('    multi_edit_file - Multiple edits in one call');
        console.log('    append_file     - Append to file');
        console.log('    insert_at_line  - Insert at specific line');
        console.log('    read_lines      - Read specific lines');
        console.log('    delete_file     - Delete a file');
        console.log('    move_file       - Move/rename file');
        console.log('    copy_file       - Copy a file');
        console.log('    file_info       - Get file metadata');

        console.log(colors.secondary('\n  DIRECTORY (3):'));
        console.log('    list_directory  - List directory contents');
        console.log('    create_directory - Create directories');
        console.log('    tree            - Show directory tree');

        console.log(colors.secondary('\n  SEARCH (4):'));
        console.log('    search_files    - Search by glob pattern');
        console.log('    grep            - Search text in files');
        console.log('    find_replace    - Find and replace text');
        console.log('    codebase_search - Fuzzy code search');

        console.log(colors.secondary('\n  COMMANDS (1):'));
        console.log('    run_command     - Execute shell command');

        console.log(colors.secondary('\n  GIT (4):'));
        console.log('    git_status      - Show git status');
        console.log('    git_diff        - Show git diff');
        console.log('    git_log         - Show commit history');
        console.log('    git_commit      - Create a commit');

        console.log(colors.secondary('\n  WEB (1):'));
        console.log('    web_fetch       - Fetch URL content');

        console.log(colors.secondary('\n  CLAUDE CODE STYLE (2):'));
        console.log('    todo_write      - Track tasks in todo list');
        console.log('    ask_user        - Ask user for input');

        console.log('\n' + colors.muted('  The AI uses these tools automatically based on your request.') + '\n');
        return null;
    }
});

// /history - List conversations
registerCommand({
    name: 'history',
    description: 'List saved conversations',
    handler: async (args, raw, ctx) => {
        if (ctx.listConversations) {
            const conversations = await ctx.listConversations();
            if (conversations.length === 0) {
                printInfo('No saved conversations');
            } else {
                console.log('\n' + colors.primary('Saved Conversations:') + '\n');
                for (const conv of conversations.slice(0, 10)) {
                    console.log(`  ${colors.muted(conv.id.slice(0, 15))}  ${conv.name}  ${colors.muted(`(${conv.messageCount} msgs)`)}`);
                }
                console.log();
            }
        }
        return null;
    }
});

// /load - Load a conversation
registerCommand({
    name: 'load',
    description: 'Load a saved conversation',
    argumentHint: '<id>',
    handler: async (args, raw, ctx) => {
        if (!args[0]) {
            printInfo('Usage: /load <conversation-id>');
            return null;
        }
        if (ctx.loadConversation) {
            const conv = await ctx.loadConversation(args[0]);
            if (conv) {
                ctx.messages.length = 0;
                ctx.messages.push(...conv.messages);
                printSuccess(`Loaded: ${conv.name}`);
            } else {
                printError('Conversation not found');
            }
        }
        return null;
    }
});

// /save - Rename/save conversation
registerCommand({
    name: 'save',
    aliases: ['rename'],
    description: 'Rename current conversation',
    argumentHint: '<name>',
    handler: async (args, raw, ctx) => {
        if (!raw) {
            printInfo('Usage: /save <name>');
            return null;
        }
        if (ctx.renameConversation) {
            await ctx.renameConversation(ctx.sessionId, raw);
            printSuccess(`Conversation renamed to: ${raw}`);
        }
        return null;
    }
});

// /export - Export conversation
registerCommand({
    name: 'export',
    description: 'Export conversation as markdown',
    handler: async (args, raw, ctx) => {
        if (ctx.exportConversation) {
            const md = await ctx.exportConversation(ctx.sessionId);
            if (md) {
                const filename = `conversation_${Date.now()}.md`;
                const filepath = path.join(ctx.cwd, filename);
                await fs.writeFile(filepath, md);
                printSuccess(`Exported to: ${filename}`);
            } else {
                printError('Nothing to export');
            }
        }
        return null;
    }
});

// /agents - List agents
registerCommand({
    name: 'agents',
    description: 'List available agents',
    handler: async (args, raw, ctx) => {
        // Load agents if not already loaded
        await loadAgents(ctx.cwd);
        printAgentsList();
        return null;
    }
});

// /agent - Use a specific agent
registerCommand({
    name: 'agent',
    description: 'Use a specific agent',
    argumentHint: '<name> [task]',
    handler: async (args, raw, ctx) => {
        if (!args[0]) {
            printInfo('Usage: /agent <agent-name> [task description]');
            printInfo('Type /agents to see available agents');
            return null;
        }

        // Load agents
        await loadAgents(ctx.cwd);

        const agentName = args[0];
        const task = args.slice(1).join(' ') || 'Help me with the current project';

        const agent = getAgent(agentName);
        if (!agent) {
            printError(`Agent not found: ${agentName}`);
            printInfo('Type /agents to see available agents');
            return null;
        }

        // Create agent context and inject prompt
        const agentCtx = createAgentContext(agentName, task, ctx);
        if (agentCtx) {
            printInfo(`Activating ${agentName} agent...`);
            return {
                type: 'inject',
                prompt: agentCtx.systemPrompt,
                allowedTools: agent.tools
            };
        }
        return null;
    }
});

// /init-config - Create MYLOCALCLI.md project config
registerCommand({
    name: 'init-config',
    aliases: ['config-init'],
    description: 'Create MYLOCALCLI.md project configuration',
    handler: async (args, raw, ctx) => {
        const configPath = path.join(ctx.cwd, 'MYLOCALCLI.md');

        try {
            // Check if config already exists
            await fs.access(configPath);
            printWarning('MYLOCALCLI.md already exists in this directory');
            printInfo('Edit it to customize project instructions');
            return null;
        } catch (e) {
            // File doesn't exist, create it
        }

        const template = `---
name: ${path.basename(ctx.cwd)}
description: Project configuration for MyLocalCLI
---

# Project Instructions

This is the configuration file for MyLocalCLI. Add any project-specific instructions here.

## Coding Standards

- Follow the existing code style
- Add comments for complex logic
- Write tests for new features

## Important Notes

Add any project-specific notes or context here that the AI should know about.
`;

        await fs.writeFile(configPath, template, 'utf-8');
        printSuccess('Created MYLOCALCLI.md');
        printInfo('Edit this file to customize AI behavior for this project');
        return null;
    }
});

// /skills - List skills
registerCommand({
    name: 'skills',
    description: 'List available skills',
    handler: async (args, raw, ctx) => {
        await loadSkills(ctx.cwd);
        printSkillsList();
        return null;
    }
});

// /mode - Show or switch modes
registerCommand({
    name: 'mode',
    aliases: ['modes'],
    description: 'Show or switch agent/performance modes',
    argumentHint: '[build|plan|smart|rush]',
    handler: async (args, raw, ctx) => {
        if (!args[0]) {
            printModeStatus();
            return null;
        }

        const modeName = args[0].toLowerCase();

        // Try agent modes first
        if (AGENT_MODES[modeName]) {
            setAgentMode(modeName);
            console.log(getModeSwitchMessage(modeName));
            return null;
        }

        // Try performance modes
        if (PERFORMANCE_MODES[modeName]) {
            setPerformanceMode(modeName);
            console.log(getModeSwitchMessage(modeName));
            return null;
        }

        printError(`Unknown mode: ${modeName}`);
        printInfo('Available modes: build, plan, smart, rush');
        return null;
    }
});

// /build - Quick switch to build mode
registerCommand({
    name: 'build',
    description: 'Switch to BUILD mode (full access)',
    handler: async (args, raw, ctx) => {
        setAgentMode('build');
        console.log(getModeSwitchMessage('build'));
        return null;
    }
});

// /plan - Quick switch to plan mode
registerCommand({
    name: 'plan',
    description: 'Switch to PLAN mode (read-only)',
    handler: async (args, raw, ctx) => {
        setAgentMode('plan');
        console.log(getModeSwitchMessage('plan'));
        return null;
    }
});

// /smart - Quick switch to smart mode
registerCommand({
    name: 'smart',
    description: 'Switch to SMART mode (max capability)',
    handler: async (args, raw, ctx) => {
        setPerformanceMode('smart');
        console.log(getModeSwitchMessage('smart'));
        return null;
    }
});

// /rush - Quick switch to rush mode
registerCommand({
    name: 'rush',
    description: 'Switch to RUSH mode (fast & efficient)',
    handler: async (args, raw, ctx) => {
        setPerformanceMode('rush');
        console.log(getModeSwitchMessage('rush'));
        return null;
    }
});

// /shortcuts - Show keyboard shortcuts
registerCommand({
    name: 'shortcuts',
    aliases: ['keys', 'keyboard'],
    description: 'Show keyboard shortcuts',
    handler: async (args, raw, ctx) => {
        console.log(`
${colors.primary('━━━ Keyboard Shortcuts ━━━')}

  ${colors.secondary('Tab')}          Switch between BUILD/PLAN modes
  ${colors.secondary('Ctrl+C')}       Cancel current operation / Exit
  ${colors.secondary('↑/↓')}          Navigate input history
  ${colors.secondary('Tab')}          Auto-complete commands

${colors.primary('━━━ Shell Mode (Quick Commands) ━━━')}

  ${colors.secondary('$ <cmd>')}      Run shell command (output in AI context)
  ${colors.secondary('$$ <cmd>')}     Run shell command (incognito - not in context)

  Examples:
    $ npm test      - Run tests, AI sees results
    $$ git status   - Check status, AI doesn't see it

${colors.primary('━━━ Mode Commands ━━━')}

  ${colors.secondary('/mode')}        Show current modes
  ${colors.secondary('/build')}       Switch to BUILD mode (full access)
  ${colors.secondary('/plan')}        Switch to PLAN mode (read-only)
  ${colors.secondary('/smart')}       Switch to SMART mode (max capability)
  ${colors.secondary('/rush')}        Switch to RUSH mode (fast)
`);
        return null;
    }
});

// ========================================
// CONTEXT PINNING COMMANDS
// ========================================

// /pin - Pin a file to always include in context
registerCommand({
    name: 'pin',
    description: 'Pin a file to always include in AI context',
    argumentHint: '<file>',
    handler: async (args, raw, ctx) => {
        if (!raw) {
            printInfo('Usage: /pin <file-path>');
            printInfo('Example: /pin src/utils.js');
            return null;
        }

        const filePath = raw.trim();
        pinFile(filePath);
        printSuccess(`📌 Pinned: ${filePath}`);
        printInfo('This file will always be included in AI context.');
        return null;
    }
});

// /unpin - Unpin a file
registerCommand({
    name: 'unpin',
    description: 'Unpin a file from context',
    argumentHint: '<file>',
    handler: async (args, raw, ctx) => {
        if (!raw) {
            printInfo('Usage: /unpin <file-path>');
            printPinnedFiles();
            return null;
        }

        const filePath = raw.trim();
        if (unpinFile(filePath)) {
            printSuccess(`📌 Unpinned: ${filePath}`);
        } else {
            printWarning(`File not pinned: ${filePath}`);
        }
        return null;
    }
});

// /pins - List pinned files
registerCommand({
    name: 'pins',
    aliases: ['pinned'],
    description: 'List all pinned files',
    handler: async (args, raw, ctx) => {
        printPinnedFiles();
        return null;
    }
});

// ========================================
// SESSION BRANCHING COMMANDS
// ========================================

// /branch - Create a new branch
registerCommand({
    name: 'branch',
    description: 'Create a conversation branch',
    argumentHint: '<name>',
    handler: async (args, raw, ctx) => {
        if (!raw) {
            await printBranchesList(ctx.sessionId);
            return null;
        }

        const branchName = raw.trim().replace(/\s+/g, '-');
        const branch = await createBranch(branchName, ctx.messages, ctx.sessionId);
        printSuccess(`🌿 Created branch: ${branchName}`);
        printInfo('Your current conversation was saved to this branch.');
        return null;
    }
});

// /branches - List branches
registerCommand({
    name: 'branches',
    description: 'List conversation branches',
    handler: async (args, raw, ctx) => {
        await printBranchesList(ctx.sessionId);
        return null;
    }
});

// /checkout - Switch to a branch
registerCommand({
    name: 'checkout',
    description: 'Switch to a conversation branch',
    argumentHint: '<name>',
    handler: async (args, raw, ctx) => {
        if (!raw) {
            printInfo('Usage: /checkout <branch-name>');
            await printBranchesList(ctx.sessionId);
            return null;
        }

        const branchName = raw.trim();

        if (branchName === 'main') {
            ctx.messages.length = 0;
            setCurrentBranch('main');
            printSuccess('🌿 Switched to main branch (conversation cleared)');
            return null;
        }

        const branch = await loadBranch(branchName, ctx.sessionId);
        if (branch) {
            ctx.messages.length = 0;
            ctx.messages.push(...branch.messages);
            printSuccess(`🌿 Switched to branch: ${branchName}`);
            printInfo(`Loaded ${branch.messages.length} messages.`);
        } else {
            printError(`Branch not found: ${branchName}`);
        }
        return null;
    }
});

// ========================================
// PROJECT TEMPLATE COMMANDS
// ========================================

// /init - Initialize project with template
registerCommand({
    name: 'init',
    description: 'Initialize project with a template',
    argumentHint: '[template]',
    handler: async (args, raw, ctx) => {
        if (!raw) {
            printTemplatesList();
            return null;
        }

        const templateName = raw.trim();
        const result = await initializeProject(templateName, ctx.cwd);

        if (result.success) {
            printSuccess(`${result.template.icon} Initialized ${result.template.name} project!`);
            printInfo(`Created: MYLOCALCLI.md`);
            printInfo('The AI will now follow these guidelines for your project.');
        } else {
            printError(result.error);
            printTemplatesList();
        }
        return null;
    }
});

// /templates - List templates
registerCommand({
    name: 'templates',
    description: 'List available project templates',
    handler: async (args, raw, ctx) => {
        printTemplatesList();
        return null;
    }
});

// ========================================
// SKILL COMMANDS
// ========================================

// /skill - Skill management
registerCommand({
    name: 'skill',
    description: 'Create or manage custom skills',
    argumentHint: '<create|search> <name>',
    handler: async (args, raw, ctx) => {
        const subcommand = args[0]?.toLowerCase();
        const skillName = args.slice(1).join('-') || args[1];

        if (!subcommand) {
            console.log(`
${colors.primary('━━━ Skill Commands ━━━')}

  ${colors.secondary('/skill create <name>')}  Create a new custom skill
  ${colors.secondary('/skill search <query>')} Search skills by keyword
  ${colors.secondary('/skills')}               List all skills

Example:
  /skill create my-react-tips
  /skill search testing
`);
            return null;
        }

        if (subcommand === 'create') {
            if (!skillName) {
                printInfo('Usage: /skill create <skill-name>');
                return null;
            }
            await createSkillTemplate(skillName, ctx.cwd);
            printInfo('Edit the SKILL.md file to customize your skill.');
            return null;
        }

        if (subcommand === 'search') {
            const query = args.slice(1).join(' ');
            if (!query) {
                printInfo('Usage: /skill search <query>');
                return null;
            }
            await loadSkills(ctx.cwd);
            const results = searchSkills(query);
            if (results.length === 0) {
                printInfo(`No skills found matching: ${query}`);
            } else {
                console.log(`\n${colors.primary('Search Results:')}\n`);
                for (const skill of results) {
                    console.log(`  ${colors.secondary(skill.name)} - ${colors.muted(skill.description || '')}`);
                }
                console.log();
            }
            return null;
        }

        printInfo('Unknown subcommand. Use: create, search');
        return null;
    }
});

// ========================================
// SUBAGENT COMMANDS
// ========================================

// /subagents - List subagents
registerCommand({
    name: 'subagents',
    aliases: ['subs'],
    description: 'List available subagents (@mentions)',
    handler: async (args, raw, ctx) => {
        printSubagentsList();
        return null;
    }
});

export default {
    registerCommand,
    registerCustomCommand,
    getCommand,
    getAllCommands,
    parseCommand,
    executeCommand,
    loadCustomCommands,
    parseCommandFile,
    detectSubagentMention
};
