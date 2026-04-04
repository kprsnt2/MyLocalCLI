import inquirer from 'inquirer';
import { promptWithPrefix, loadInputHistory, showContextStatus } from '../ui/input.js';
import { LMStudioProvider } from '../providers/lmstudio.js';
import { OllamaProvider } from '../providers/ollama.js';
import { OpenAIProvider } from '../providers/openai.js';
import { OpenRouterProvider } from '../providers/openrouter.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import { getProvider, getApiKey, getModel, getBaseUrl } from '../config/settings.js';
import { PROVIDERS } from '../config/providers.js';
import { loadProjectConfig, formatProjectConfigForPrompt } from '../config/project.js';
import { getRelevantContext, formatContextForPrompt } from './context.js';
import { TOOLS, executeTool, parseToolCalls } from './tools.js';
import { executeCommand, loadCustomCommands } from './commands.js';
import { loadSkills, getSkillContext, findMatchingSkills } from '../skills/skill.js';
import {
    generateSessionId,
    saveMessage,
    listConversations,
    loadConversation,
    renameConversation,
    exportConversation
} from '../utils/history.js';
import { renderMarkdown } from '../ui/markdown.js';
import { thinkingSpinner } from '../ui/spinner.js';
import {
    printLogo,
    printWelcome,
    printUserMessage,
    printAssistantStart,
    printAssistantChunk,
    printAssistantEnd,
    printError,
    printSuccess,
    printInfo,
    printWarning,
    printHelp,
    printProvidersList,
    printModelsList,
    printDivider,
    colors
} from '../ui/terminal.js';
import { renderStatusBar, renderModeSwitchNotification, getInlineStatus } from '../ui/statusbar.js';
import {
    getAgentMode,
    toggleAgentMode,
    isToolAllowed,
    printModeStatus,
    getModeSwitchMessage
} from './modes.js';
import { getPinnedContext, getPinnedFiles } from './pinning.js';
import { detectSubagentMention, createSubagentContext } from './subagents.js';
import { CostTracker, estimateCost } from './costTracker.js';
import { ToolPermissionContext } from './permissions.js';
import { TranscriptStore } from './transcript.js';
import { PromptRouter } from './router.js';
import { getRegistry } from './registry.js';
import { getStreamEmitter } from './streamEvents.js';
import { HistoryLog } from './historyLog.js';
import { animatedStartup, toolSpinner, animatedSessionSummary, animatedModeSwitch, getToolIcon } from '../ui/animations.js';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Export createProvider so it can be used by server
export function createProvider(providerName) {
    const apiKey = getApiKey(providerName);
    const model = getModel(providerName);
    const baseUrl = getBaseUrl(providerName);

    switch (providerName) {
        case 'lmstudio':
            return new LMStudioProvider({ baseUrl, model });
        case 'ollama':
            return new OllamaProvider({ baseUrl, model });
        case 'openrouter':
            return new OpenRouterProvider({ apiKey, model });
        case 'nvidia':
            return new NvidiaProvider({ apiKey, model, baseUrl });
        case 'openai':
        case 'groq':
            return new OpenAIProvider({ apiKey, model, baseUrl });
        case 'custom':
            return new OpenAIProvider({ apiKey, model, baseUrl });
        default:
            return new LMStudioProvider({ baseUrl, model });
    }
}

// Main chat loop
export async function startChat(options = {}) {
    const cwd = options.cwd || process.cwd();
    const sessionId = options.sessionId || generateSessionId();
    const enableTools = options.enableTools !== false;

    // Get current provider and settings
    const providerName = getProvider();
    const provider = createProvider(providerName);

    // Animated startup
    await animatedStartup({ fast: !!options.loadSession });
    printWelcome(PROVIDERS[providerName]?.name || providerName, getModel(providerName));

    // Check if provider is available
    if (providerName === 'lmstudio') {
        const isRunning = await provider.isServerRunning();
        if (!isRunning) {
            printError('LM Studio server is not running. Start LM Studio and load a model first.');
            printInfo('Or switch to another provider: mylocalcli config --provider ollama');
            return;
        }
        printSuccess('Connected to LM Studio');
    } else if (providerName === 'ollama') {
        const isRunning = await provider.isServerRunning();
        if (!isRunning) {
            printError('Ollama is not running. Start Ollama first with: ollama serve');
            printInfo('Or switch to OpenRouter: mylocalcli config --provider openrouter');
            return;
        }
        printSuccess('Connected to Ollama');
    } else if (providerName === 'openrouter') {
        const apiKey = getApiKey('openrouter');
        if (!apiKey) {
            printError('OpenRouter API key not set!');
            printInfo('Get your free key at: https://openrouter.ai/keys');
            printInfo('Then run: mylocalcli config --key YOUR_API_KEY');
            return;
        }
        printSuccess('Using OpenRouter');
    } else if (providerName === 'openai') {
        const apiKey = getApiKey('openai');
        if (!apiKey) {
            printError('OpenAI API key not set!');
            printInfo('Get your key at: https://platform.openai.com/api-keys');
            printInfo('Then run: mylocalcli config --key YOUR_API_KEY');
            return;
        }
        printSuccess('Using OpenAI');
    } else if (providerName === 'groq') {
        const apiKey = getApiKey('groq');
        if (!apiKey) {
            printError('Groq API key not set!');
            printInfo('Get your key at: https://console.groq.com/keys');
            printInfo('Then run: mylocalcli config --key YOUR_API_KEY');
            return;
        }
        printSuccess('Using Groq');
    } else if (providerName === 'nvidia') {
        const apiKey = getApiKey('nvidia');
        if (!apiKey) {
            printError('NVIDIA API key not set!');
            printInfo('Get your key at: https://build.nvidia.com');
            printInfo('Then run: mylocalcli config --provider nvidia --key YOUR_API_KEY');
            return;
        }
        printSuccess('Using NVIDIA API');
    }

    // Claude Code features - session tracking
    const costTracker = new CostTracker();
    const transcript = new TranscriptStore();
    const permissionContext = new ToolPermissionContext();
    const historyLog = new HistoryLog();
    const streamEmitter = getStreamEmitter();
    const registry = getRegistry();
    const router = new PromptRouter();

    historyLog.add('session_start', `provider=${providerName} model=${getModel(providerName)}`);
    streamEmitter.emitMessageStart(sessionId, 'Session initialized');

    // Conversation history
    let messages = [];

    // Load existing session if provided
    if (options.loadSession) {
        const existing = await loadConversation(options.loadSession);
        if (existing) {
            messages = existing.messages || [];
            printInfo(`Loaded conversation: ${existing.name}`);

            // Print last few messages
            const recent = messages.slice(-4);
            for (const msg of recent) {
                if (msg.role === 'user') {
                    printUserMessage(msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : ''));
                }
            }
            printDivider();
        }
    }

    // Show tools info if enabled
    if (enableTools) {
        const mode = getAgentMode();
        printInfo(`Tool calling enabled. Mode: ${mode.color(mode.displayName)} - ${mode.description}`);
    }

    // Show keyboard shortcuts hint
    printInfo(`${colors.muted('Tab: switch mode • $ cmd: shell • /help: commands')}`);

    // Load custom commands from user directories
    await loadCustomCommands(cwd);

    // Track shell command outputs for context
    let lastShellOutput = null;

    // Main loop
    while (true) {
        try {
            // Get current mode for display
            const currentMode = getAgentMode();
            const modePrefix = currentMode.color(`[${currentMode.displayName}]`);

            // Use enhanced input with history and tab completion
            const input = await promptWithPrefix(`${modePrefix} You`);

            const trimmedInput = input.trim();

            if (!trimmedInput) continue;

            // Handle Tab key for mode switching (if input is just 'TAB' or empty toggle)
            if (trimmedInput === '\t' || trimmedInput.toLowerCase() === 'tab') {
                const newMode = toggleAgentMode();
                await animatedModeSwitch(newMode.name, 'agent');
                continue;
            }

            // Handle shell mode ($ prefix) - inspired by AmpCode
            if (trimmedInput.startsWith('$')) {
                const isIncognito = trimmedInput.startsWith('$$');
                const shellCmd = isIncognito ? trimmedInput.slice(2).trim() : trimmedInput.slice(1).trim();

                if (shellCmd) {
                    console.log(colors.muted(`\n  Executing: ${shellCmd}\n`));
                    try {
                        const output = execSync(shellCmd, {
                            cwd,
                            encoding: 'utf-8',
                            timeout: 30000,
                            maxBuffer: 1024 * 1024
                        });
                        console.log(colors.secondary(output));

                        // Add to context unless incognito mode
                        if (!isIncognito) {
                            lastShellOutput = { command: shellCmd, output: output.slice(0, 2000) };
                            printInfo('Command output added to AI context');
                        } else {
                            printInfo('Incognito mode - output not added to context');
                        }
                    } catch (error) {
                        console.log(colors.error(error.message));
                        if (!isIncognito) {
                            lastShellOutput = { command: shellCmd, output: `Error: ${error.message}` };
                        }
                    }
                }
                continue;
            }

            // Handle /mode command for quick mode switching
            if (trimmedInput === '/mode' || trimmedInput === '/modes') {
                printModeStatus();
                continue;
            }

            // Handle slash commands using the new command system
            if (trimmedInput.startsWith('/')) {
                const commandCtx = {
                    providerName,
                    provider,
                    messages,
                    cwd,
                    sessionId,
                    model: getModel(providerName),
                    PROVIDERS,
                    printProvidersList,
                    printModelsList,
                    listConversations,
                    loadConversation,
                    renameConversation,
                    exportConversation,
                    costTracker,
                    transcript,
                    permissionContext,
                    historyLog,
                    streamEmitter,
                    registry,
                    router
                };

                const { handled, exit, result } = await executeCommand(trimmedInput, commandCtx);

                if (exit) break;

                // Handle injected prompts from custom commands
                if (result && result.type === 'inject') {
                    // Treat the command prompt as a user message to the AI
                    const commandPrompt = result.prompt;
                    messages.push({ role: 'user', content: commandPrompt });
                    await saveMessage(sessionId, { role: 'user', content: commandPrompt });
                    // Don't continue - let it fall through to send to AI
                } else {
                    continue;
                }
            } else {
                // Regular user message
                messages.push({ role: 'user', content: trimmedInput });
                await saveMessage(sessionId, { role: 'user', content: trimmedInput });
                transcript.append({ role: 'user', content: trimmedInput });

                // Route prompt to suggest matching tools
                const routeMatches = router.routePrompt(trimmedInput, 3);
                if (routeMatches.length > 0) {
                    historyLog.add('routing', `matches=${routeMatches.length} for prompt`);
                }
            }

            // Get context
            const context = await getRelevantContext(cwd, trimmedInput);

            // Load project configuration (MYLOCALCLI.md)
            const projectConfig = await loadProjectConfig(cwd);

            // Load skills and get relevant skill context based on project files
            await loadSkills(cwd);
            const projectFiles = context.relevantFiles?.map(f => f.path) || [];
            const skillContext = getSkillContext(projectFiles);

            // Build system message with tools info
            let systemContent = `You are MyLocalCLI, a powerful AI coding assistant.
Working directory: ${cwd}
Project type: ${context.projectType || 'unknown'}

You can help with coding tasks, explain code, debug issues, and more.`;

            // Inject project configuration if available
            if (projectConfig) {
                systemContent += formatProjectConfigForPrompt(projectConfig);
            }

            // Inject relevant skills based on project context
            if (skillContext) {
                systemContent += '\n\n' + skillContext;
            }

            if (enableTools) {
                systemContent += `

## TOOL USAGE INSTRUCTIONS

You have access to tools to interact with files, run commands, and more.

**TO USE A TOOL, YOU MUST OUTPUT THIS EXACT FORMAT:**

\`\`\`json
{
  "tool": "TOOL_NAME",
  "arguments": {
    "argument_name": "value"
  }
}
\`\`\`

**CRITICAL RULES:**
1. Output the JSON inside a code block with \`\`\`json
2. Use ONLY the exact tool names listed below
3. Wait for my response after each tool call before continuing
4. Do NOT add any text inside the JSON code block - only the JSON object

## AVAILABLE TOOLS (42)

FILE TOOLS:
- write_file(path, content) - Create or overwrite a file
- read_file(path) - Read file contents
- edit_file(path, old_content, new_content) - Replace text in file
- multi_edit_file(path, edits[]) - Multiple replacements at once
- patch_file(path, patch) - Apply a unified diff patch
- append_file(path, content) - Add content to end of file
- delete_file(path) - Delete a file
- copy_file(source, destination) - Copy file
- move_file(source, destination) - Move/rename file
- file_info(path) - Get file metadata
- read_lines(path, start, end) - Read specific line range
- insert_at_line(path, line, content) - Insert at line number

DIRECTORY TOOLS:
- list_directory(path) - List files and folders
- create_directory(path) - Create directory
- tree(path, depth) - Show directory tree
- batch_rename(directory, find, replace, dry_run) - Rename files by pattern

SEARCH TOOLS:
- search_files(pattern) - Find files by glob pattern
- grep(pattern, path, include) - Search text in files
- find_replace(find, replace, path) - Find and replace text
- codebase_search(query) - Semantic code search
- compare_files(file_a, file_b) - Diff two files

COMMAND TOOLS:
- run_command(command) - Execute shell command

GIT TOOLS:
- git_status() - Get git status
- git_diff(staged) - Get git diff
- git_log(count) - Show commit history
- git_commit(message) - Create commit
- git_branch(action, name) - Create/list/switch/delete branches
- git_stash(action, message) - Save/pop/list/drop stashed changes

WEB & HTTP TOOLS:
- web_fetch(url) - Fetch URL content
- http_request(url, method, headers, body) - Full HTTP client (GET/POST/PUT/DELETE)

PROJECT TOOLS:
- test_run(command, filter) - Auto-detect and run project tests
- lint_check(fix) - Run project linter
- dependency_check(audit) - Check dependencies and vulnerabilities
- project_stats(path) - Lines of code and file counts by language

DATA & UTILITY TOOLS:
- json_query(path, query) - Query JSON files by dot-notation path
- regex_test(pattern, text, flags) - Test regex and return matches
- hash_file(path, algorithm) - Compute MD5/SHA-256 hash
- port_check(port) - Check if a port is in use
- memory_store(action, key, value) - Session key-value storage (set/get/list/delete)

WORKFLOW TOOLS:
- todo_write(todos[]) - Manage task list
- ask_user(question, options) - Ask user a question
- notebook(name, action, content) - Create/manage markdown notebooks

## EXAMPLES

To create an HTML file:
\`\`\`json
{
  "tool": "write_file",
  "arguments": {
    "path": "index.html",
    "content": "<!DOCTYPE html>\\n<html>\\n<head><title>Hello</title></head>\\n<body><h1>Hello World</h1></body>\\n</html>"
  }
}
\`\`\`

To list directory:
\`\`\`json
{
  "tool": "list_directory",
  "arguments": {
    "path": "."
  }
}
\`\`\`

To run a command:
\`\`\`json
{
  "tool": "run_command",
  "arguments": {
    "command": "npm install"
  }
}
\`\`\`

To run tests:
\`\`\`json
{
  "tool": "test_run",
  "arguments": {}
}
\`\`\`

To query a JSON file:
\`\`\`json
{
  "tool": "json_query",
  "arguments": {
    "path": "package.json",
    "query": "dependencies"
  }
}
\`\`\`

To make an HTTP request:
\`\`\`json
{
  "tool": "http_request",
  "arguments": {
    "url": "https://api.example.com/data",
    "method": "GET"
  }
}
\`\`\`

After I execute the tool, I will tell you the result. Then continue with your next step.`;
            }

            if (context.relevantFiles && context.relevantFiles.length > 0) {
                systemContent += '\n\n--- RELEVANT FILES ---\n';
                for (const file of context.relevantFiles.slice(0, 3)) {
                    systemContent += `\n### ${file.path}\n\`\`\`${file.language}\n${file.content.slice(0, 2000)}\n\`\`\``;
                }
            }

            // Show thinking spinner
            const spinner = thinkingSpinner();
            spinner.start();

            try {
                // Stream response
                let fullResponse = '';
                spinner.stop();
                printAssistantStart();

                const messagesWithSystem = [
                    { role: 'system', content: systemContent },
                    ...messages
                ];

                for await (const chunk of provider.stream(messagesWithSystem, {})) {
                    printAssistantChunk(chunk);
                    fullResponse += chunk;
                }

                printAssistantEnd();

                // Track cost (estimate based on response length)
                const inputTokenEstimate = messages.reduce((sum, m) => sum + (m.content?.length || 0) / 4, 0);
                const outputTokenEstimate = Math.ceil(fullResponse.length / 4);
                const model = getModel(providerName);
                const cost = estimateCost(model, inputTokenEstimate, outputTokenEstimate);
                costTracker.record('chat', inputTokenEstimate, outputTokenEstimate, cost);
                streamEmitter.emitCostUpdate(costTracker.summary);
                historyLog.add('response', `tokens_out=${outputTokenEstimate} cost=$${cost.toFixed(4)}`);

                // Check for tool calls
                if (enableTools) {
                    const toolCalls = parseToolCalls(fullResponse);

                    const toolResults = await Promise.all(toolCalls.map(async (toolCall) => {
                        if (!permissionContext.allows(toolCall.name)) {
                            printWarning(`🚫 Tool "${toolCall.name}" blocked by permission policy`);
                            streamEmitter.emitPermissionDenial(toolCall.name, 'denied by permission context');
                            historyLog.add('permission_denial', toolCall.name);
                            return { name: toolCall.name, success: false, error: 'blocked by permissions' };
                        }

                        const currentMode = getAgentMode();
                        if (!isToolAllowed(toolCall.name)) {
                            printWarning(`🚫 Tool "${toolCall.name}" blocked - ${currentMode.displayName} mode is read-only`);
                            streamEmitter.emitPermissionDenial(toolCall.name, 'mode restriction');
                            return { name: toolCall.name, success: false, error: 'blocked by Read-Only PLAN mode' };
                        }

                        streamEmitter.emitToolUse(toolCall.name, toolCall.arguments);
                        const tSpinner = toolSpinner(toolCall.name, toolCall.name);
                        tSpinner.start();
                        
                        const result = await executeTool(toolCall.name, toolCall.arguments, cwd);
                        
                        if (result.success) {
                            tSpinner.succeed(`${toolCall.name} done`);
                        } else {
                            tSpinner.fail(`${toolCall.name} failed`);
                        }

                        streamEmitter.emitToolResult(toolCall.name, result);
                        registry.registerTool(toolCall.name, 'chat');
                        registry.recordToolExecution(toolCall.name, result);
                        historyLog.add('tool_exec', `${toolCall.name} success=${result.success}`);
                        
                        return { name: toolCall.name, ...result };
                    }));

                    if (toolResults.length > 0) {
                        let combinedToolContent = '';
                        for (const result of toolResults) {
                            if (result.success && result.content) {
                                combinedToolContent += `[Tool Result: ${result.name}]\n${result.content.slice(0, 3000)}\n\n`;
                            } else if (!result.success) {
                                combinedToolContent += `[Tool Failed: ${result.name}]\n${result.error}\n\n`;
                            }
                        }
                        if (combinedToolContent) {
                            // Don't push fullResponse duplicate if it's already there
                            if (messages[messages.length - 1]?.content !== fullResponse) {
                                messages.push({ role: 'assistant', content: fullResponse });
                            }
                            messages.push({ role: 'user', content: combinedToolContent });
                        }
                    }
                }

                // Save assistant message
                messages.push({ role: 'assistant', content: fullResponse });
                await saveMessage(sessionId, { role: 'assistant', content: fullResponse });
                transcript.append({ role: 'assistant', content: fullResponse });
                streamEmitter.emitMessageStop(costTracker.summary, 'completed');

            } catch (error) {
                spinner.stop();
                printError(error.message);
            }

        } catch (error) {
            if (error.name === 'ExitPromptError') {
                // User pressed Ctrl+C
                break;
            }
            printError(error.message);
        }
    }

    // Show animated session summary on exit
    if (costTracker.totalTokens > 0 || messages.length > 2) {
        await animatedSessionSummary({
            tokens: costTracker.totalTokens,
            cost: costTracker.totalCost.toFixed(4),
            duration: costTracker.duration,
            messages: messages.length,
            tools: registry.totalExecutions
        });
    }
    historyLog.add('session_end', `messages=${messages.length} tokens=${costTracker.totalTokens}`);
    console.log(colors.muted('  Goodbye! 👋\n'));
}

export default { startChat, createProvider };
