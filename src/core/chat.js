import inquirer from 'inquirer';
import { LMStudioProvider } from '../providers/lmstudio.js';
import { OllamaProvider } from '../providers/ollama.js';
import { OpenAIProvider } from '../providers/openai.js';
import { OpenRouterProvider } from '../providers/openrouter.js';
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

    // Load custom commands from user directories
    await loadCustomCommands(cwd);

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
                    exportConversation
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

## AVAILABLE TOOLS (26)

FILE TOOLS:
- write_file(path, content) - Create or overwrite a file
- read_file(path) - Read file contents
- edit_file(path, old_content, new_content) - Replace text in file
- multi_edit_file(path, edits[]) - Multiple replacements at once
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

SEARCH TOOLS:
- search_files(pattern) - Find files by glob pattern
- grep(pattern, path, include) - Search text in files
- find_replace(find, replace, path) - Find and replace text
- codebase_search(query) - Semantic code search

COMMAND TOOLS:
- run_command(command) - Execute shell command

GIT TOOLS:
- git_status() - Get git status
- git_diff(staged) - Get git diff
- git_log(count) - Show commit history
- git_commit(message) - Create commit

OTHER TOOLS:
- web_fetch(url) - Fetch URL content
- todo_write(todos[]) - Manage task list
- ask_user(question, options) - Ask user a question

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

export default { startChat, createProvider };
