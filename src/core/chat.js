import inquirer from 'inquirer';
import { LMStudioProvider } from '../providers/lmstudio.js';
import { OllamaProvider } from '../providers/ollama.js';
import { OpenAIProvider } from '../providers/openai.js';
import { OpenRouterProvider } from '../providers/openrouter.js';
import { getProvider, getApiKey, getModel, getBaseUrl } from '../config/settings.js';
import { PROVIDERS } from '../config/providers.js';
import { getRelevantContext, formatContextForPrompt } from './context.js';
import { TOOLS, executeTool, parseToolCalls } from './tools.js';
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

    // Print welcome
    printLogo();
    printWelcome(PROVIDERS[providerName]?.name || providerName, getModel(providerName));

    // Check if provider is available
    if (providerName === 'lmstudio') {
        const isRunning = await provider.isServerRunning();
        if (!isRunning) {
            printError('LM Studio server is not running. Start LM Studio and load a model first.');
            printInfo('Or switch to another provider: localcoder config --provider ollama');
            return;
        }
        printSuccess('Connected to LM Studio');
    } else if (providerName === 'ollama') {
        const isRunning = await provider.isServerRunning();
        if (!isRunning) {
            printError('Ollama is not running. Start Ollama first with: ollama serve');
            printInfo('Or switch to OpenRouter: localcoder config --provider openrouter');
            return;
        }
        printSuccess('Connected to Ollama');
    }

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
        printInfo('Tool calling enabled. I can read/write files and run commands.');
    }

    // Main loop
    while (true) {
        try {
            const { input } = await inquirer.prompt([{
                type: 'input',
                name: 'input',
                message: colors.user('You:'),
                prefix: ''
            }]);

            const trimmedInput = input.trim();

            if (!trimmedInput) continue;

            // Handle commands
            if (trimmedInput.startsWith('/')) {
                const handled = await handleCommand(trimmedInput, {
                    providerName,
                    provider,
                    messages,
                    cwd,
                    sessionId
                });
                if (handled === 'exit') break;
                continue;
            }

            // Save user message
            messages.push({ role: 'user', content: trimmedInput });
            await saveMessage(sessionId, { role: 'user', content: trimmedInput });

            // Get context
            const context = await getRelevantContext(cwd, trimmedInput);

            // Build system message with tools info
            let systemContent = `You are MyLocalCLI, a powerful AI coding assistant.
Working directory: ${cwd}
Project type: ${context.projectType || 'unknown'}

You can help with coding tasks, explain code, debug issues, and more.`;

            if (enableTools) {
                systemContent += `

You have access to these tools. To use a tool, respond with a JSON code block:
\`\`\`json
{
  "tool": "tool_name",
  "arguments": { ... }
}
\`\`\`

Available tools:
FILE OPERATIONS:
- read_file: Read file contents. Args: { "path": "file" }
- write_file: Write/create file. Args: { "path": "file", "content": "..." }
- edit_file: Edit part of file. Args: { "path": "file", "old_content": "...", "new_content": "..." }
- append_file: Append to file. Args: { "path": "file", "content": "..." }
- insert_at_line: Insert at line. Args: { "path": "file", "line": 10, "content": "..." }
- read_lines: Read specific lines. Args: { "path": "file", "start": 1, "end": 50 }
- delete_file: Delete file/folder. Args: { "path": "file" }
- move_file: Move/rename. Args: { "source": "old", "destination": "new" }
- copy_file: Copy file. Args: { "source": "src", "destination": "dest" }
- file_info: Get file info. Args: { "path": "file" }

DIRECTORY:
- list_directory: List contents. Args: { "path": "dir", "recursive": false }
- create_directory: Create folder. Args: { "path": "dir" }
- tree: Show tree structure. Args: { "path": ".", "depth": 3 }

SEARCH:
- search_files: Find files by pattern. Args: { "pattern": "*.js" }
- grep: Search in files. Args: { "pattern": "text", "path": ".", "include": "*.js" }
- find_replace: Find/replace in files. Args: { "find": "old", "replace": "new", "include": "*.js" }

COMMANDS:
- run_command: Execute shell command. Args: { "command": "npm test" }

GIT:
- git_status: Get status. Args: {}
- git_diff: Show diff. Args: { "staged": false }
- git_log: Show commits. Args: { "count": 10 }
- git_commit: Commit changes. Args: { "message": "..." }

WEB:
- web_fetch: Fetch URL content. Args: { "url": "https://..." }

After using a tool, I'll show you the result and you can continue.`;
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

                // Check for tool calls
                if (enableTools) {
                    const toolCalls = parseToolCalls(fullResponse);

                    for (const toolCall of toolCalls) {
                        printInfo(`🔧 Tool: ${toolCall.name}`);
                        const result = await executeTool(toolCall.name, toolCall.arguments, cwd);

                        if (result.success) {
                            // Add tool result to messages and continue conversation
                            const toolResultMsg = `Tool ${toolCall.name} executed successfully.`;
                            if (result.content) {
                                messages.push({ role: 'assistant', content: fullResponse });
                                messages.push({ role: 'user', content: `[Tool Result]\n${result.content.slice(0, 3000)}` });
                            }
                        } else {
                            printError(`Tool failed: ${result.error}`);
                        }
                    }
                }

                // Save assistant message
                messages.push({ role: 'assistant', content: fullResponse });
                await saveMessage(sessionId, { role: 'assistant', content: fullResponse });

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

    console.log('\n' + colors.muted('Goodbye! 👋\n'));
}

async function handleCommand(input, ctx) {
    const [command, ...args] = input.slice(1).split(' ');

    switch (command.toLowerCase()) {
        case 'exit':
        case 'quit':
        case 'q':
            return 'exit';

        case 'help':
        case 'h':
            printHelp();
            printInfo('\nAdditional commands:');
            printInfo('  /history    - List saved conversations');
            printInfo('  /load <id>  - Load a conversation');
            printInfo('  /save <name>- Rename current conversation');
            printInfo('  /export     - Export conversation as markdown');
            printInfo('  /tools      - Toggle tool calling');
            break;

        case 'clear':
            ctx.messages.length = 0;
            printSuccess('Conversation cleared');
            break;

        case 'config':
            printInfo(`Provider: ${ctx.providerName}`);
            printInfo(`Model: ${getModel(ctx.providerName)}`);
            printInfo(`Working Directory: ${ctx.cwd}`);
            break;

        case 'provider':
        case 'providers':
            printProvidersList(PROVIDERS, ctx.providerName);
            break;

        case 'models':
            const models = await ctx.provider.listModels();
            printModelsList(models);
            break;

        case 'model':
            if (args[0]) {
                printInfo(`Model set to: ${args[0]}`);
            } else {
                printInfo(`Current model: ${getModel(ctx.providerName)}`);
            }
            break;

        case 'history':
            const conversations = await listConversations();
            if (conversations.length === 0) {
                printInfo('No saved conversations');
            } else {
                console.log('\n' + colors.primary('Saved Conversations:') + '\n');
                for (const conv of conversations.slice(0, 10)) {
                    console.log(`  ${colors.muted(conv.id.slice(0, 15))}  ${conv.name}  ${colors.muted(`(${conv.messageCount} msgs)`)}`);
                }
                console.log();
            }
            break;

        case 'load':
            if (args[0]) {
                const conv = await loadConversation(args[0]);
                if (conv) {
                    ctx.messages.length = 0;
                    ctx.messages.push(...conv.messages);
                    printSuccess(`Loaded: ${conv.name}`);
                } else {
                    printError('Conversation not found');
                }
            } else {
                printInfo('Usage: /load <conversation-id>');
            }
            break;

        case 'save':
        case 'rename':
            if (args.length > 0) {
                const name = args.join(' ');
                await renameConversation(ctx.sessionId, name);
                printSuccess(`Conversation renamed to: ${name}`);
            } else {
                printInfo('Usage: /save <name>');
            }
            break;

        case 'export':
            const md = await exportConversation(ctx.sessionId);
            if (md) {
                const filename = `conversation_${Date.now()}.md`;
                await fs.writeFile(path.join(ctx.cwd, filename), md);
                printSuccess(`Exported to: ${filename}`);
            } else {
                printError('Nothing to export');
            }
            break;

        case 'tools':
            console.log('\n' + colors.primary('Available Tools:') + '\n');
            console.log(colors.secondary('  FILE OPERATIONS:'));
            console.log('    read_file, write_file, edit_file, append_file');
            console.log('    insert_at_line, read_lines, delete_file, move_file, copy_file, file_info');
            console.log(colors.secondary('\n  DIRECTORY:'));
            console.log('    list_directory, create_directory, tree');
            console.log(colors.secondary('\n  SEARCH:'));
            console.log('    search_files, grep, find_replace');
            console.log(colors.secondary('\n  COMMANDS:'));
            console.log('    run_command');
            console.log(colors.secondary('\n  GIT:'));
            console.log('    git_status, git_diff, git_log, git_commit');
            console.log(colors.secondary('\n  WEB:'));
            console.log('    web_fetch');
            console.log('\n' + colors.muted('  22 tools total. The AI will use them automatically.') + '\n');
            break;

        default:
            printError(`Unknown command: ${command}`);
            printInfo('Type /help for available commands');
    }

    return null;
}

export default { startChat, createProvider };
