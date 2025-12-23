// MyLocalCLI - Enhanced Input System
// Provides readline-based input with history, tab completion, and multi-line support

import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { colors } from './terminal.js';

// History file location
const HISTORY_DIR = path.join(os.homedir(), '.mylocalcli');
const HISTORY_FILE = path.join(HISTORY_DIR, 'input_history');
const MAX_HISTORY = 500;

// Input history array
let inputHistory = [];
let historyIndex = -1;

/**
 * Load input history from file
 */
export async function loadInputHistory() {
    try {
        await fs.mkdir(HISTORY_DIR, { recursive: true });
        const content = await fs.readFile(HISTORY_FILE, 'utf-8');
        inputHistory = content.split('\n').filter(line => line.trim());
        // Keep only last MAX_HISTORY entries
        if (inputHistory.length > MAX_HISTORY) {
            inputHistory = inputHistory.slice(-MAX_HISTORY);
        }
    } catch (error) {
        // File doesn't exist yet, start with empty history
        inputHistory = [];
    }
}

/**
 * Save input history to file
 */
export async function saveInputHistory() {
    try {
        await fs.mkdir(HISTORY_DIR, { recursive: true });
        await fs.writeFile(HISTORY_FILE, inputHistory.slice(-MAX_HISTORY).join('\n'), 'utf-8');
    } catch (error) {
        // Silently fail - history is convenience, not critical
    }
}

/**
 * Add entry to history
 */
export function addToHistory(input) {
    if (input.trim() && input !== inputHistory[inputHistory.length - 1]) {
        inputHistory.push(input);
        // Async save, don't wait
        saveInputHistory();
    }
    historyIndex = inputHistory.length;
}

/**
 * Get available slash commands for completion
 */
function getSlashCommands() {
    return [
        '/help', '/exit', '/clear', '/config', '/providers', '/models',
        '/tools', '/history', '/load', '/save', '/export', '/agents',
        '/agent', '/skills', '/init-config'
    ];
}

/**
 * Tab completion handler
 */
function completer(line) {
    // Slash command completion
    if (line.startsWith('/')) {
        const commands = getSlashCommands();
        const hits = commands.filter(cmd => cmd.startsWith(line));
        return [hits.length ? hits : commands, line];
    }

    // Agent name completion after /agent
    if (line.startsWith('/agent ')) {
        const agents = ['code-reviewer', 'code-explorer', 'test-generator', 'refactorer', 'doc-writer'];
        const partial = line.slice(7); // Remove '/agent '
        const hits = agents.filter(a => a.startsWith(partial)).map(a => '/agent ' + a);
        return [hits, line];
    }

    return [[], line];
}

/**
 * Create enhanced readline interface
 */
export function createEnhancedInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: completer,
        historySize: MAX_HISTORY,
        removeHistoryDuplicates: true
    });

    // Load history into readline
    inputHistory.forEach(entry => {
        rl.history.unshift(entry);
    });

    return rl;
}

/**
 * Prompt for input with history and completion
 * @param {string} promptText - The prompt to display
 * @returns {Promise<string>} - User input
 */
export function prompt(promptText = '> ') {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: completer,
            terminal: true
        });

        // Pre-populate history
        inputHistory.forEach(entry => {
            rl.history.unshift(entry);
        });

        rl.question(promptText, (answer) => {
            rl.close();
            if (answer.trim()) {
                addToHistory(answer);
            }
            resolve(answer);
        });
    });
}

/**
 * Multi-line input mode
 * Enter with triple backticks ```, exit with another ```
 * @returns {Promise<string>}
 */
export function promptMultiLine(promptText = 'Paste code (end with ``` on new line):\n') {
    return new Promise((resolve) => {
        console.log(colors.muted(promptText));

        const lines = [];
        let inCodeBlock = false;

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        rl.on('line', (line) => {
            if (line.trim() === '```') {
                if (inCodeBlock) {
                    rl.close();
                    resolve(lines.join('\n'));
                } else {
                    inCodeBlock = true;
                }
            } else {
                lines.push(line);
            }
        });

        rl.on('close', () => {
            resolve(lines.join('\n'));
        });
    });
}

/**
 * Prompt with checkmark display
 */
export async function promptWithPrefix(prefix = 'You') {
    // Display the prompt prefix with styling
    process.stdout.write(`\n${colors.success('✔')} ${colors.user(prefix + ':')} `);

    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: completer,
            terminal: true,
            prompt: ''
        });

        // Pre-populate history
        inputHistory.forEach(entry => {
            rl.history.unshift(entry);
        });

        rl.on('line', (answer) => {
            rl.close();
            if (answer.trim()) {
                addToHistory(answer);
            }
            resolve(answer);
        });

        rl.on('SIGINT', () => {
            rl.close();
            resolve('/exit');
        });
    });
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens, maxTokens = 128000) {
    const percentage = Math.round((tokens / maxTokens) * 100);
    let color = colors.success;
    if (percentage > 80) color = colors.error;
    else if (percentage > 50) color = colors.warning;

    return color(`[${tokens.toLocaleString()}/${maxTokens.toLocaleString()} tokens (${percentage}%)]`);
}

/**
 * Display context window status
 */
export function showContextStatus(messageCount, estimatedTokens, maxTokens = 128000) {
    const tokenDisplay = formatTokenCount(estimatedTokens, maxTokens);
    console.log(colors.muted(`  📊 ${messageCount} messages ${tokenDisplay}`));
}

/**
 * Clear the current line and display new content
 */
export function clearLine() {
    process.stdout.write('\r\x1b[K');
}

/**
 * Show streaming progress indicator
 */
let streamingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let streamingIndex = 0;
let streamingInterval = null;

export function startStreamingIndicator(label = 'Thinking') {
    streamingIndex = 0;
    streamingInterval = setInterval(() => {
        process.stdout.write(`\r${colors.secondary(streamingChars[streamingIndex])} ${colors.muted(label)}...`);
        streamingIndex = (streamingIndex + 1) % streamingChars.length;
    }, 80);
}

export function stopStreamingIndicator() {
    if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;
        clearLine();
    }
}

// Initialize history on module load
loadInputHistory();

export default {
    loadInputHistory,
    saveInputHistory,
    addToHistory,
    prompt,
    promptMultiLine,
    promptWithPrefix,
    formatTokenCount,
    showContextStatus,
    clearLine,
    startStreamingIndicator,
    stopStreamingIndicator,
    createEnhancedInput
};
