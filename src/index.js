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

const program = new Command();

program
    .name('mylocalcli')
    .description('Your Own AI Coding Assistant - Private, Local, Yours')
    .version('2.0.0');

// Default command - start chat
program
    .command('chat', { isDefault: true })
    .description('Start interactive chat (default)')
    .option('-p, --provider <provider>', 'Provider to use (lmstudio, ollama, openrouter, openai, groq, custom)')
    .option('-m, --model <model>', 'Model to use')
    .option('--no-tools', 'Disable tool calling')
    .option('-l, --load <sessionId>', 'Load a previous conversation')
    .action(async (options) => {
        if (options.provider) {
            setProvider(options.provider);
        }
        if (options.model) {
            setModel(getProvider(), options.model);
        }
        await startChat({
            cwd: process.cwd(),
            enableTools: options.tools !== false,
            loadSession: options.load
        });
    });

// Initialize/configure command
program
    .command('init')
    .description('Initialize MyLocalCLI with a setup wizard')
    .action(async () => {
        printLogo();
        console.log(chalk.hex('#7C3AED')('Welcome to MyLocalCLI Setup!\n'));

        // Select provider
        const { provider } = await inquirer.prompt([{
            type: 'list',
            name: 'provider',
            message: 'Select your AI provider:',
            choices: [
                { name: '🏠 LM Studio (Local LLM)', value: 'lmstudio' },
                { name: '🦙 Ollama (Local LLM)', value: 'ollama' },
                { name: '🌐 OpenRouter (Free models available)', value: 'openrouter' },
                { name: '🔑 OpenAI API', value: 'openai' },
                { name: '⚡ Groq (Ultra-fast)', value: 'groq' },
                { name: '⚙️  Custom OpenAI-compatible endpoint', value: 'custom' }
            ]
        }]);

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

        console.log(chalk.hex('#7C3AED')(`\n  Open your browser to: `) + chalk.hex('#06B6D4')(`http://localhost:${port}\n`));
        console.log(chalk.gray('  Press Ctrl+C to stop the server\n'));
    });

// Parse arguments
program.parse();

