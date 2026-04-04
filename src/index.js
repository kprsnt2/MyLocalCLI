#!/usr/bin/env node

// MyLocalCLI - Your Own AI Coding Assistant
// Private, Local, Yours

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { startChat } from './core/chat.js';
import { PROVIDERS } from './config/providers.js';
import {
    getProvider,
    setProvider,
    getApiKey,
    setApiKey,
    getModel,
    setModel,
    setCustomEndpoint,
    getBaseUrl,
    resetConfig
} from './config/settings.js';
import { LMStudioProvider } from './providers/lmstudio.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { NvidiaProvider } from './providers/nvidia.js';
import {
    listConversations,
    deleteConversation,
    clearAllConversations,
    exportConversation
} from './utils/history.js';
import {
    printLogo,
    printSuccess,
    printError,
    printInfo,
    printWarning,
    printProvidersList,
    printModelsList,
    colors
} from './ui/terminal.js';
import { createSpinner } from './ui/spinner.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read version from package.json
const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
    .name('mylocalcli')
    .description('Your Own AI Coding Assistant - Private, Local, Yours')
    .version(packageJson.version);

// Default command - start chat
program
    .command('chat', { isDefault: true })
    .description('Start interactive chat (default: OpenCode-style TUI)')
    .option('-p, --provider <provider>', 'Provider to use (lmstudio, ollama, openrouter, openai, groq, nvidia, custom)')
    .option('-m, --model <model>', 'Model to use')
    .option('--no-tools', 'Disable tool calling')
    .option('-l, --load <sessionId>', 'Load a previous conversation')
    .option('--classic', 'Use classic terminal mode instead of TUI')
    .action(async (options) => {
        if (options.provider) {
            setProvider(options.provider);
        }
        if (options.model) {
            setModel(getProvider(), options.model);
        }

        // Use TUI by default, --classic for old mode
        if (options.classic) {
            await startChat({
                cwd: process.cwd(),
                enableTools: options.tools !== false,
                loadSession: options.load
            });
        } else {
            // Use new OpenCode-style TUI
            const { startTUI } = await import('./ui/tui.js');
            await startTUI({
                cwd: process.cwd(),
                enableTools: options.tools !== false
            });
        }
    });

// Initialize/configure command
program
    .command('init')
    .description('Initialize MyLocalCLI with a setup wizard')
    .action(async () => {
        printLogo();
        console.log(chalk.hex('#7C3AED')('Welcome to MyLocalCLI Setup!\n'));

        // Longer delay to ensure terminal is ready (fixes blank screen issue on some terminals)
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Select provider - using rawlist for numbered options (more compatible)
            const { provider } = await inquirer.prompt([{
                type: 'rawlist',
                name: 'provider',
                message: 'Select your AI provider (enter number):',
                choices: [
                    { name: 'LM Studio (Local LLM)', value: 'lmstudio' },
                    { name: 'Ollama (Local LLM)', value: 'ollama' },
                    { name: 'OpenRouter (Free models available)', value: 'openrouter' },
                    { name: 'OpenAI API', value: 'openai' },
                    { name: 'Groq (Ultra-fast)', value: 'groq' },
                    { name: 'NVIDIA API (NIM endpoints)', value: 'nvidia' },
                    { name: 'Custom OpenAI-compatible endpoint', value: 'custom' }
                ]
            }]);

            // Validate provider was selected
            if (!provider) {
                printWarning('No provider selected. Run `mylocalcli init` again to set up.');
                return;
            }

            setProvider(provider);

            // Provider-specific setup
            if (provider === 'lmstudio') {
                const { endpoint } = await inquirer.prompt([{
                    type: 'input',
                    name: 'endpoint',
                    message: 'LM Studio endpoint:',
                    default: 'http://localhost:1234/v1'
                }]);

                setCustomEndpoint('lmstudio', endpoint);

                // Test connection
                const spinner = createSpinner('Testing connection to LM Studio...');
                spinner.start();

                const lmProvider = new LMStudioProvider({ baseUrl: endpoint });
                const isRunning = await lmProvider.isServerRunning();

                if (isRunning) {
                    spinner.succeed('Connected to LM Studio!');

                    // Fetch available models
                    const models = await lmProvider.listModels();
                    if (models.length > 0) {
                        const { model } = await inquirer.prompt([{
                            type: 'list',
                            name: 'model',
                            message: 'Select a model:',
                            choices: models.map(m => ({ name: m.name, value: m.id }))
                        }]);
                        setModel('lmstudio', model);
                    }
                } else {
                    spinner.warn('LM Studio is not running. Start it and load a model before using MyLocalCLI.');
                }

            } else if (provider === 'ollama') {
                const { endpoint } = await inquirer.prompt([{
                    type: 'input',
                    name: 'endpoint',
                    message: 'Ollama endpoint:',
                    default: 'http://localhost:11434'
                }]);

                setCustomEndpoint('ollama', endpoint);

                // Test connection
                const spinner = createSpinner('Testing connection to Ollama...');
                spinner.start();

                const ollamaProvider = new OllamaProvider({ baseUrl: endpoint });
                const isRunning = await ollamaProvider.isServerRunning();

                if (isRunning) {
                    spinner.succeed('Connected to Ollama!');

                    // Fetch available models
                    const models = await ollamaProvider.listModels();
                    if (models.length > 0) {
                        const { model } = await inquirer.prompt([{
                            type: 'list',
                            name: 'model',
                            message: 'Select a model:',
                            choices: models.map(m => ({ name: `${m.name}`, value: m.id }))
                        }]);
                        setModel('ollama', model);
                    } else {
                        console.log(chalk.yellow('\nNo models found. Pull a model first:'));
                        console.log(chalk.gray('  ollama pull llama3.2\n'));
                    }
                } else {
                    spinner.warn('Ollama is not running. Start it with: ollama serve');
                }

            } else if (provider === 'openrouter') {
                console.log(chalk.gray('\nGet your free API key at: https://openrouter.ai/keys\n'));

                const { apiKey } = await inquirer.prompt([{
                    type: 'password',
                    name: 'apiKey',
                    message: 'OpenRouter API key (press Enter to skip for now):',
                    mask: '*'
                }]);

                if (apiKey) {
                    setApiKey('openrouter', apiKey);
                }

                // Select model
                const orProvider = new OpenRouterProvider({});
                const models = orProvider.getFreeModels();

                const { model } = await inquirer.prompt([{
                    type: 'list',
                    name: 'model',
                    message: 'Select a free model:',
                    choices: models.map(m => ({ name: m.name, value: m.id }))
                }]);

                setModel('openrouter', model);

            } else if (provider === 'openai') {
                console.log(chalk.gray('\nGet your API key at: https://platform.openai.com/api-keys\n'));

                const { apiKey } = await inquirer.prompt([{
                    type: 'password',
                    name: 'apiKey',
                    message: 'OpenAI API key:',
                    mask: '*'
                }]);

                if (apiKey) {
                    setApiKey('openai', apiKey);
                }

                const { model } = await inquirer.prompt([{
                    type: 'list',
                    name: 'model',
                    message: 'Select a model:',
                    choices: [
                        { name: 'GPT-4o Mini (Recommended)', value: 'gpt-4o-mini' },
                        { name: 'GPT-4o', value: 'gpt-4o' },
                        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
                    ]
                }]);

                setModel('openai', model);

            } else if (provider === 'groq') {
                console.log(chalk.gray('\nGet your API key at: https://console.groq.com/keys\n'));

                const { apiKey } = await inquirer.prompt([{
                    type: 'password',
                    name: 'apiKey',
                    message: 'Groq API key:',
                    mask: '*'
                }]);

                if (apiKey) {
                    setApiKey('groq', apiKey);
                }

                const { model } = await inquirer.prompt([{
                    type: 'list',
                    name: 'model',
                    message: 'Select a model:',
                    choices: [
                        { name: 'Llama 3.3 70B (Recommended)', value: 'llama-3.3-70b-versatile' },
                        { name: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile' },
                        { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
                        { name: 'Gemma 2 9B', value: 'gemma2-9b-it' }
                    ]
                }]);

                setModel('groq', model);

            } else if (provider === 'nvidia') {
                console.log(chalk.gray('\nGet your NVIDIA API key at: https://build.nvidia.com\n'));

                const { apiKey } = await inquirer.prompt([{
                    type: 'password',
                    name: 'apiKey',
                    message: 'NVIDIA API key:',
                    mask: '*'
                }]);

                if (apiKey) {
                    setApiKey('nvidia', apiKey);
                }

                // Try to list models from NVIDIA
                const spinner = createSpinner('Checking NVIDIA API...');
                spinner.start();
                const nvidiaProvider = new NvidiaProvider({ apiKey });
                const isAvailable = await nvidiaProvider.isServerRunning();

                if (isAvailable) {
                    spinner.succeed('Connected to NVIDIA API!');
                    let models;
                    try {
                        models = await nvidiaProvider.listModels();
                    } catch {
                        models = nvidiaProvider.listModels ? await nvidiaProvider.listModels() : [];
                    }

                    if (models.length > 0) {
                        const { model } = await inquirer.prompt([{
                            type: 'list',
                            name: 'model',
                            message: 'Select a model:',
                            choices: models.slice(0, 15).map(m => ({ name: `${m.name} (${m.owned_by})`, value: m.id }))
                        }]);
                        setModel('nvidia', model);
                    } else {
                        setModel('nvidia', 'z-ai/glm5');
                        printInfo('Using default model: z-ai/glm5');
                    }
                } else {
                    spinner.warn('Could not connect to NVIDIA API. Check your API key.');
                    setModel('nvidia', 'z-ai/glm5');
                }

            } else if (provider === 'custom') {
                const { endpoint, apiKey, model } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'endpoint',
                        message: 'API endpoint URL:',
                        validate: (input) => input.startsWith('http') ? true : 'Please enter a valid URL'
                    },
                    {
                        type: 'password',
                        name: 'apiKey',
                        message: 'API key (if required):',
                        mask: '*'
                    },
                    {
                        type: 'input',
                        name: 'model',
                        message: 'Model name:',
                        default: 'default'
                    }
                ]);

                setCustomEndpoint('custom', endpoint);
                if (apiKey) setApiKey('custom', apiKey);
                setModel('custom', model);
            }

            console.log();
            printSuccess('Setup complete! Run `mylocalcli` to start chatting.');
            console.log();
        } catch (error) {
            if (error.name === 'ExitPromptError') {
                console.log('\nSetup cancelled.');
            } else {
                printError(`Setup failed: ${error.message}`);
            }
        }
    });

// Config command
program
    .command('config')
    .description('View or update configuration')
    .option('-p, --provider <provider>', 'Set provider')
    .option('-m, --model <model>', 'Set model')
    .option('-k, --key <key>', 'Set API key for current provider')
    .option('-e, --endpoint <url>', 'Set custom endpoint')
    .option('--reset', 'Reset all configuration')
    .option('--show', 'Show current configuration')
    .action(async (options) => {
        if (options.reset) {
            resetConfig();
            printSuccess('Configuration reset to defaults');
            return;
        }

        if (options.provider) {
            if (!PROVIDERS[options.provider]) {
                printError(`Unknown provider: ${options.provider}`);
                printInfo(`Available: ${Object.keys(PROVIDERS).join(', ')}`);
                return;
            }
            setProvider(options.provider);
            printSuccess(`Provider set to: ${options.provider}`);
        }

        if (options.model) {
            setModel(getProvider(), options.model);
            printSuccess(`Model set to: ${options.model}`);
        }

        if (options.key) {
            setApiKey(getProvider(), options.key);
            printSuccess('API key saved');
        }

        if (options.endpoint) {
            setCustomEndpoint(getProvider(), options.endpoint);
            printSuccess(`Endpoint set to: ${options.endpoint}`);
        }

        if (options.show || (!options.provider && !options.model && !options.key && !options.endpoint)) {
            const current = getProvider();
            console.log();
            printInfo(`Provider: ${PROVIDERS[current]?.icon} ${PROVIDERS[current]?.name || current}`);
            printInfo(`Model: ${getModel(current)}`);
            printInfo(`Endpoint: ${getBaseUrl(current)}`);
            printInfo(`API Key: ${getApiKey(current) ? '********' : '(not set)'}`);
            console.log();
        }
    });

// Models command
program
    .command('models')
    .description('List available models')
    .action(async () => {
        const provider = getProvider();
        const spinner = createSpinner('Fetching models...');
        spinner.start();

        try {
            let models = [];

            if (provider === 'lmstudio') {
                const lm = new LMStudioProvider({ baseUrl: getBaseUrl(provider) });
                models = await lm.listModels();
            } else if (provider === 'ollama') {
                const ollama = new OllamaProvider({ baseUrl: getBaseUrl(provider) });
                models = await ollama.listModels();
            } else if (provider === 'openrouter') {
                const or = new OpenRouterProvider({});
                models = or.getFreeModels();
            } else if (provider === 'groq') {
                models = [
                    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', owned_by: 'Meta' },
                    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', owned_by: 'Meta' },
                    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', owned_by: 'Mistral' },
                    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', owned_by: 'Google' }
                ];
            } else if (provider === 'nvidia') {
                const nv = new NvidiaProvider({
                    apiKey: getApiKey('nvidia'),
                    baseUrl: getBaseUrl('nvidia')
                });
                models = await nv.listModels();
            } else {
                models = [
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', owned_by: 'OpenAI' },
                    { id: 'gpt-4o', name: 'GPT-4o', owned_by: 'OpenAI' },
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', owned_by: 'OpenAI' }
                ];
            }

            spinner.stop();
            printModelsList(models);

        } catch (error) {
            spinner.fail('Failed to fetch models');
            printError(error.message);
        }
    });

// Providers command
program
    .command('providers')
    .description('List available providers')
    .action(() => {
        printProvidersList(PROVIDERS, getProvider());
    });

// History command
program
    .command('history')
    .description('Manage conversation history')
    .option('-l, --list', 'List all conversations')
    .option('-d, --delete <id>', 'Delete a conversation')
    .option('-c, --clear', 'Clear all conversations')
    .option('-e, --export <id>', 'Export a conversation as markdown')
    .action(async (options) => {
        if (options.clear) {
            const { confirm } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to delete all conversations?',
                default: false
            }]);

            if (confirm) {
                await clearAllConversations();
                printSuccess('All conversations deleted');
            }
            return;
        }

        if (options.delete) {
            const deleted = await deleteConversation(options.delete);
            if (deleted) {
                printSuccess('Conversation deleted');
            } else {
                printError('Conversation not found');
            }
            return;
        }

        if (options.export) {
            const md = await exportConversation(options.export);
            if (md) {
                const filename = `conversation_${options.export.slice(0, 10)}.md`;
                await fs.writeFile(filename, md);
                printSuccess(`Exported to: ${filename}`);
            } else {
                printError('Conversation not found');
            }
            return;
        }

        // Default: list conversations
        const conversations = await listConversations();
        if (conversations.length === 0) {
            printInfo('No saved conversations');
        } else {
            console.log('\n' + colors.primary('Saved Conversations:') + '\n');
            for (const conv of conversations) {
                const date = new Date(conv.modified).toLocaleDateString();
                console.log(`  ${colors.muted(conv.id)}`);
                console.log(`    ${conv.name} ${colors.muted(`(${conv.messageCount} msgs, ${date})`)}`);
            }
            console.log();
            printInfo('Use `mylocalcli chat --load <id>` to continue a conversation');
        }
    });

// Web UI command
program
    .command('web')
    .description('Start the web UI')
    .option('-p, --port <port>', 'Port to run on', '3456')
    .action(async (options) => {
        printLogo();

        const port = parseInt(options.port);

        // Import and start server
        const { startWebServer } = await import('./core/server.js');
        startWebServer({ port });

        console.log(chalk.hex('#7C3AED')('\n  Open your browser to: ') + chalk.hex('#06B6D4')(`http://localhost:${port}\n`));
        console.log(chalk.gray('  Press Ctrl+C to stop the server\n'));
    });

// TUI command - OpenCode-style full-screen interface
program
    .command('tui')
    .description('Start OpenCode-style full-screen TUI')
    .action(async () => {
        const { startTUI } = await import('./ui/tui.js');
        const provider = getProvider();
        startTUI({ provider });
    });

// Setup command - Show workspace environment report
program
    .command('setup')
    .description('Show workspace setup and environment report')
    .action(async () => {
        const { runSetup } = await import('./core/setupReport.js');
        const report = await runSetup(process.cwd());
        console.log(report.formatMarkdown());
    });

// Bootstrap command - Show startup graph
program
    .command('bootstrap')
    .description('Show startup bootstrap graph')
    .action(async () => {
        const { runBootstrap } = await import('./core/bootstrap.js');
        const graph = await runBootstrap();
        console.log(graph.formatMarkdown());
    });

// Sessions command - List saved sessions
program
    .command('sessions')
    .description('List saved sessions with token tracking')
    .action(async () => {
        const { listSessions } = await import('./core/session.js');
        try {
            const sessions = await listSessions();
            if (sessions.length === 0) {
                console.log('No saved sessions');
            } else {
                console.log('\nSaved Sessions:\n');
                for (const s of sessions) {
                    const date = new Date(s.createdAt).toLocaleDateString();
                    console.log(`  ${s.sessionId.slice(0, 12)}  ${s.totalTokens} tokens  ${s.provider || 'unknown'}  ${date}`);
                }
                console.log();
            }
        } catch {
            console.log('No saved sessions');
        }
    });

// System-init command - Show system init message
program
    .command('system-init')
    .description('Show system initialization report')
    .action(async () => {
        const { buildSystemInitMessage } = await import('./core/setupReport.js');
        console.log(buildSystemInitMessage());
    });

// Doctor command - Check local model endpoints and all provider connectivity
program
    .command('doctor')
    .description('Check provider connectivity and local model availability')
    .option('-e, --endpoint <url>', 'Check a specific OpenAI-compatible endpoint')
    .action(async () => {
        printLogo();
        console.log(chalk.hex('#7C3AED').bold('  Provider Health Check\n'));

        const { printConnectionStatus } = await import('./ui/terminal.js');

        const checks = [
            {
                name: 'LM Studio',
                icon: '🏠',
                check: async () => {
                    const url = getBaseUrl('lmstudio') || 'http://localhost:1234/v1';
                    const lm = new LMStudioProvider({ baseUrl: url });
                    const running = await lm.isServerRunning();
                    if (running) {
                        const models = await lm.listModels();
                        return { connected: true, detail: `${models.length} model(s) at ${url}` };
                    }
                    return { connected: false, detail: url };
                }
            },
            {
                name: 'Ollama',
                icon: '🦙',
                check: async () => {
                    const url = getBaseUrl('ollama') || 'http://localhost:11434';
                    const ol = new OllamaProvider({ baseUrl: url });
                    const running = await ol.isServerRunning();
                    if (running) {
                        const models = await ol.listModels();
                        return { connected: true, detail: `${models.length} model(s) at ${url}` };
                    }
                    return { connected: false, detail: url };
                }
            },
            {
                name: 'OpenRouter',
                icon: '🌐',
                check: async () => {
                    const key = getApiKey('openrouter');
                    if (!key) return { connected: false, detail: 'no API key set' };
                    try {
                        const res = await fetch('https://openrouter.ai/api/v1/models', {
                            headers: { 'Authorization': `Bearer ${key}` },
                            signal: AbortSignal.timeout(5000)
                        });
                        return { connected: res.ok, detail: res.ok ? 'API key valid' : `HTTP ${res.status}` };
                    } catch {
                        return { connected: false, detail: 'connection failed' };
                    }
                }
            },
            {
                name: 'OpenAI',
                icon: '🔑',
                check: async () => {
                    const key = getApiKey('openai');
                    if (!key) return { connected: false, detail: 'no API key set' };
                    try {
                        const res = await fetch('https://api.openai.com/v1/models', {
                            headers: { 'Authorization': `Bearer ${key}` },
                            signal: AbortSignal.timeout(5000)
                        });
                        return { connected: res.ok, detail: res.ok ? 'API key valid' : `HTTP ${res.status}` };
                    } catch {
                        return { connected: false, detail: 'connection failed' };
                    }
                }
            },
            {
                name: 'Groq',
                icon: '⚡',
                check: async () => {
                    const key = getApiKey('groq');
                    if (!key) return { connected: false, detail: 'no API key set' };
                    try {
                        const res = await fetch('https://api.groq.com/openai/v1/models', {
                            headers: { 'Authorization': `Bearer ${key}` },
                            signal: AbortSignal.timeout(5000)
                        });
                        return { connected: res.ok, detail: res.ok ? 'API key valid' : `HTTP ${res.status}` };
                    } catch {
                        return { connected: false, detail: 'connection failed' };
                    }
                }
            },
            {
                name: 'NVIDIA API',
                icon: '🟢',
                check: async () => {
                    const key = getApiKey('nvidia');
                    if (!key) return { connected: false, detail: 'no API key set' };
                    const nv = new NvidiaProvider({ apiKey: key });
                    const running = await nv.isServerRunning();
                    if (running) {
                        const models = await nv.listModels();
                        return { connected: true, detail: `${models.length} model(s) available` };
                    }
                    return { connected: false, detail: 'connection failed' };
                }
            }
        ];

        // Check custom endpoint if configured
        const customUrl = getBaseUrl('custom');
        if (customUrl) {
            checks.push({
                name: 'Custom Endpoint',
                icon: '⚙️',
                check: async () => {
                    try {
                        const res = await fetch(`${customUrl}/models`, {
                            headers: getApiKey('custom') ? { 'Authorization': `Bearer ${getApiKey('custom')}` } : {},
                            signal: AbortSignal.timeout(5000)
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const count = data.data?.length || 0;
                            return { connected: true, detail: `${count} model(s) at ${customUrl}` };
                        }
                        return { connected: false, detail: `HTTP ${res.status}` };
                    } catch {
                        return { connected: false, detail: customUrl };
                    }
                }
            });
        }

        // Run all checks
        for (const c of checks) {
            process.stdout.write(`  ${c.icon} Checking ${c.name}...`);
            try {
                const result = await c.check();
                process.stdout.write('\r' + ' '.repeat(60) + '\r');
                printConnectionStatus(c.icon + ' ' + c.name, result.connected, result.detail);
            } catch {
                process.stdout.write('\r' + ' '.repeat(60) + '\r');
                printConnectionStatus(c.icon + ' ' + c.name, false, 'check failed');
            }
        }

        // Local endpoint probe
        console.log('\n' + chalk.hex('#7C3AED').bold('  Local OpenAI-Compatible Endpoint Probe\n'));

        const localEndpoints = [
            'http://localhost:1234/v1',
            'http://localhost:11434/v1',
            'http://localhost:8080/v1',
            'http://localhost:5000/v1',
            'http://localhost:3000/v1',
            'http://127.0.0.1:1234/v1',
        ];

        let foundLocal = false;
        for (const ep of localEndpoints) {
            try {
                const res = await fetch(`${ep}/models`, { signal: AbortSignal.timeout(2000) });
                if (res.ok) {
                    const data = await res.json();
                    const count = data.data?.length || 0;
                    printConnectionStatus(ep, true, `${count} model(s)`);
                    foundLocal = true;
                }
            } catch {
                // not available
            }
        }

        if (!foundLocal) {
            printInfo('No local OpenAI-compatible endpoints found');
            printInfo('Start LM Studio, Ollama, or another local server to use local models');
        }

        const current = getProvider();
        console.log('\n' + chalk.hex('#7C3AED').bold('  Current Config\n'));
        printInfo(`Active provider: ${PROVIDERS[current]?.icon || ''} ${PROVIDERS[current]?.name || current}`);
        printInfo(`Active model: ${getModel(current)}`);
        console.log();
    });

// Parse arguments
program.parse();

