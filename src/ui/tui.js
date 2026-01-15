// MyLocalCLI - OpenCode-style TUI (Terminal User Interface)
// Fully integrated with AI providers

import readline from 'readline';
import { getAgentMode, getPerformanceMode, toggleAgentMode, isToolAllowed } from '../core/modes.js';
import { getProvider, getModel, getApiKey, getBaseUrl } from '../config/settings.js';
import { createProvider } from '../core/chat.js';
import { TOOLS, executeTool, parseToolCalls } from '../core/tools.js';
import { getRelevantContext, formatContextForPrompt } from '../core/context.js';
import { loadProjectConfig, formatProjectConfigForPrompt } from '../config/project.js';
import { saveMessage, generateSessionId } from '../utils/history.js';

// ANSI escape codes
const ESC = '\x1b';
const CSI = `${ESC}[`;

const ansi = {
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    moveTo: (row, col) => `${CSI}${row};${col}H`,
    clear: `${CSI}2J`,
    clearLine: `${CSI}2K`,
    reset: `${CSI}0m`,
    bold: `${CSI}1m`,
    dim: `${CSI}2m`,
    italic: `${CSI}3m`,
    black: `${CSI}30m`,
    red: `${CSI}31m`,
    green: `${CSI}32m`,
    yellow: `${CSI}33m`,
    blue: `${CSI}34m`,
    magenta: `${CSI}35m`,
    cyan: `${CSI}36m`,
    white: `${CSI}37m`,
    gray: `${CSI}90m`,
    bgGray: `${CSI}100m`,
};

const c = (color, text) => `${ansi[color]}${text}${ansi.reset}`;
const write = (text) => process.stdout.write(text);

const LOGO = [
    '',
    '  ╔╦╗╦ ╦╦  ╔═╗╔═╗╔═╗╦  ╔═╗╦  ╦',
    '  ║║║╚╦╝║  ║ ║║  ╠═╣║  ║  ║  ║',
    '  ╩ ╩ ╩ ╩═╝╚═╝╚═╝╩ ╩╩═╝╚═╝╩═╝╩',
    ''
];

const getSize = () => ({
    cols: process.stdout.columns || 100,
    rows: process.stdout.rows || 30
});

// Draw box with proper borders
function drawBox(row, col, width, height) {
    write(ansi.moveTo(row, col));
    write(c('gray', '┌' + '─'.repeat(width - 2) + '┐'));
    for (let i = 1; i < height - 1; i++) {
        write(ansi.moveTo(row + i, col));
        write(c('gray', '│' + ' '.repeat(width - 2) + '│'));
    }
    write(ansi.moveTo(row + height - 1, col));
    write(c('gray', '└' + '─'.repeat(width - 2) + '┘'));
}

// Status bar at bottom
function drawStatusBar(mode, perfMode, model) {
    const { cols, rows } = getSize();
    const modeColor = mode === 'build' ? 'green' : 'blue';
    const perfColor = perfMode === 'smart' ? 'magenta' : 'yellow';

    write(ansi.moveTo(rows, 1));
    write(ansi.clearLine);

    // Center - mode info
    const centerPos = Math.floor(cols / 2) - 20;
    write(ansi.moveTo(rows, centerPos));
    write(c('bold', c(modeColor, mode.charAt(0).toUpperCase() + mode.slice(1))));
    write(c('white', '  ' + model + '  '));
    write(c(perfColor, perfMode.charAt(0).toUpperCase() + perfMode.slice(1)));

    // Right - hints
    write(ansi.moveTo(rows, cols - 35));
    write(c('gray', 'tab '));
    write(c('white', 'switch mode'));
    write(c('gray', '  /help '));
    write(c('white', 'commands'));

    // Version
    write(ansi.moveTo(rows - 1, cols - 8));
    write(c('gray', 'v3.3.1'));
}

// Draw title bar
function drawTitleBar(title, tokens) {
    const { cols } = getSize();

    write(ansi.moveTo(1, 1));
    write(ansi.clearLine);
    write(c('bold', c('white', '  # ' + (title || 'New Conversation'))));

    write(ansi.moveTo(1, cols - 20));
    const percent = Math.min(100, Math.floor((tokens / 128000) * 100));
    write(c('gray', `${tokens.toLocaleString()} `));
    write(c('green', `${percent}%`));
}

// Draw input box (used in both welcome and chat screens)
function drawInputBox(row, placeholder, mode, currentInput = '') {
    const { cols } = getSize();
    const boxWidth = Math.min(cols - 10, 70);
    const boxCol = Math.floor((cols - boxWidth) / 2);

    // Draw the box
    drawBox(row, boxCol, boxWidth, 4);

    // Input text or placeholder
    write(ansi.moveTo(row + 1, boxCol + 2));
    if (currentInput) {
        write(c('white', currentInput.slice(-(boxWidth - 4))));
    } else {
        write(c('gray', placeholder || 'Ask anything... "Fix broken tests"'));
    }

    // Mode indicator on second line
    write(ansi.moveTo(row + 2, boxCol + 2));
    const modeColor = mode === 'build' ? 'green' : 'blue';
    write(c('bold', c(modeColor, mode.toUpperCase())));

    return { row, boxCol, boxWidth, inputRow: row + 1, inputCol: boxCol + 2 };
}

// Draw messages in chat view
function drawMessages(messages, startRow, maxRows, cols) {
    let row = startRow;

    // Clear message area first
    for (let r = startRow; r < startRow + maxRows; r++) {
        write(ansi.moveTo(r, 1));
        write(ansi.clearLine);
    }

    // Show last messages that fit
    const displayMsgs = messages.slice(-8);

    for (const msg of displayMsgs) {
        if (row >= startRow + maxRows - 2) break;

        write(ansi.moveTo(row, 2));

        if (msg.role === 'user') {
            write(c('cyan', '> '));
            write(c('white', msg.content.slice(0, cols - 10)));
            row++;
        } else if (msg.role === 'tool') {
            write(c('yellow', '✦ '));
            write(c('gray', msg.content.slice(0, cols - 10)));
            row++;
        } else {
            // Assistant - show truncated with proper wrapping
            const lines = msg.content.split('\n');
            for (let i = 0; i < Math.min(lines.length, 6) && row < startRow + maxRows - 2; i++) {
                write(ansi.moveTo(row, 2));
                write(lines[i].slice(0, cols - 6));
                row++;
            }
            if (lines.length > 6) {
                write(ansi.moveTo(row, 2));
                write(c('gray', `  ... (${lines.length - 6} more lines)`));
                row++;
            }
        }
    }

    return row;
}

// Main TUI
export async function startTUI(options = {}) {
    const { cols, rows } = getSize();
    const cwd = options.cwd || process.cwd();
    const providerName = getProvider();
    let provider;

    try {
        provider = createProvider(providerName);
    } catch (e) {
        // Provider might not be configured
    }

    const modelName = getModel(providerName) || 'local-model';
    const sessionId = generateSessionId();

    let messages = [];
    let tokens = 0;
    let title = '';
    let isProcessing = false;
    let currentScreen = 'welcome';
    let inputBoxInfo = null;

    // Draw welcome screen
    function drawWelcome() {
        currentScreen = 'welcome';
        const { cols, rows } = getSize();

        write(ansi.clear);

        // Logo centered
        const logoRow = Math.floor(rows / 3);
        LOGO.forEach((line, i) => {
            const col = Math.floor((cols - 32) / 2);
            write(ansi.moveTo(logoRow + i, col));
            write(c('cyan', line));
        });

        // Input box
        const mode = getAgentMode();
        const inputRow = logoRow + LOGO.length + 2;
        inputBoxInfo = drawInputBox(inputRow, 'Ask anything... "Fix broken tests"', mode.name, '');

        // Status bar
        const perfMode = getPerformanceMode();
        drawStatusBar(mode.name, perfMode.name, modelName);

        // Position cursor inside the input box
        write(ansi.moveTo(inputBoxInfo.inputRow, inputBoxInfo.inputCol));
        write(ansi.show);
    }

    // Draw chat screen with input box at bottom
    function drawChat() {
        currentScreen = 'chat';
        const { cols, rows } = getSize();

        write(ansi.clear);

        // Title bar
        drawTitleBar(title, tokens);

        // Messages area
        const msgAreaStart = 3;
        const msgAreaHeight = rows - 10;
        drawMessages(messages, msgAreaStart, msgAreaHeight, cols);

        // Input box at bottom
        const mode = getAgentMode();
        const inputRow = rows - 6;
        inputBoxInfo = drawInputBox(inputRow, 'Type your message...', mode.name, '');

        // Status bar
        const perfMode = getPerformanceMode();
        drawStatusBar(mode.name, perfMode.name, modelName);

        // Position cursor inside the input box
        write(ansi.moveTo(inputBoxInfo.inputRow, inputBoxInfo.inputCol));
        write(ansi.show);
    }

    // Show thinking spinner
    function showThinking() {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const { rows } = getSize();
        return setInterval(() => {
            write(ansi.moveTo(rows - 8, 4));
            write(c('yellow', `${frames[i]} Thinking...   `));
            i = (i + 1) % frames.length;
        }, 80);
    }

    // Handle mode toggle (called when Tab is pressed)
    function handleModeToggle() {
        toggleAgentMode();

        if (currentScreen === 'welcome') {
            drawWelcome();
        } else {
            drawChat();
        }
    }

    // Process user input with AI
    async function processInput(input) {
        if (!input.trim()) return;

        // Special commands
        if (input.trim() === '/exit' || input.trim() === '/quit') {
            write(ansi.clear);
            write(ansi.moveTo(1, 1));
            write(ansi.show);
            process.exit(0);
        }

        if (input.trim() === '/help') {
            messages.push({
                role: 'assistant',
                content:
                    'Available Commands:\n' +
                    '  /exit, /quit - Exit the application\n' +
                    '  /clear - Clear conversation and start fresh\n' +
                    '  /mode - Show current mode\n' +
                    '  $ <cmd> - Run shell command\n' +
                    '\n' +
                    'Keyboard Shortcuts:\n' +
                    '  Tab - Toggle between BUILD and PLAN modes\n' +
                    '  Ctrl+C - Exit'
            });
            drawChat();
            return;
        }

        if (input.trim() === '/clear') {
            messages = [];
            tokens = 0;
            title = '';
            drawWelcome();
            return;
        }

        if (input.trim() === '/mode') {
            const mode = getAgentMode();
            const perfMode = getPerformanceMode();
            messages.push({
                role: 'assistant',
                content: `Current modes:\n  Agent: ${mode.displayName}\n  Performance: ${perfMode.displayName}`
            });
            drawChat();
            return;
        }

        // Handle shell commands
        if (input.startsWith('$')) {
            const cmd = input.slice(input.startsWith('$$') ? 2 : 1).trim();
            messages.push({ role: 'tool', content: `Shell: ${cmd}` });
            drawChat();
            return;
        }

        // Set title from first message
        if (!title) {
            title = input.slice(0, 40);
        }

        // Add user message
        messages.push({ role: 'user', content: input });
        tokens += input.length;

        try {
            await saveMessage(sessionId, { role: 'user', content: input });
        } catch (e) { }

        isProcessing = true;
        drawChat();

        const spinner = showThinking();

        try {
            if (!provider) {
                throw new Error('No provider configured. Run: mylocalcli init');
            }

            // Build system prompt
            let systemContent = `You are MyLocalCLI, a helpful AI coding assistant.
Working directory: ${cwd}

Be concise and helpful. Format code with markdown code blocks.
The user is in ${getAgentMode().displayName} mode.`;

            // Load project config if available
            try {
                const projectConfig = await loadProjectConfig(cwd);
                if (projectConfig) {
                    systemContent += '\n\n' + formatProjectConfigForPrompt(projectConfig);
                }
            } catch (e) { }

            // Call AI with streaming
            const messagesWithSystem = [
                { role: 'system', content: systemContent },
                ...messages.filter(m => m.role === 'user' || m.role === 'assistant')
            ];

            let fullResponse = '';

            for await (const chunk of provider.stream(messagesWithSystem, {})) {
                fullResponse += chunk;
            }

            clearInterval(spinner);

            // Add response
            messages.push({ role: 'assistant', content: fullResponse });
            tokens += fullResponse.length;

            try {
                await saveMessage(sessionId, { role: 'assistant', content: fullResponse });
            } catch (e) { }

            // Handle tool calls if any
            try {
                const toolCalls = parseToolCalls(fullResponse);
                for (const tool of toolCalls) {
                    const mode = getAgentMode();
                    if (!isToolAllowed(tool.name)) {
                        messages.push({ role: 'tool', content: `🚫 ${tool.name} blocked in ${mode.displayName} mode` });
                    } else {
                        messages.push({ role: 'tool', content: `✦ Running ${tool.name}...` });
                        try {
                            const result = await executeTool(tool.name, tool.arguments, cwd);
                            messages.push({ role: 'tool', content: result.success ? `✓ ${tool.name} completed` : `✗ ${tool.name} failed` });
                        } catch (e) {
                            messages.push({ role: 'tool', content: `✗ ${tool.name} error: ${e.message}` });
                        }
                    }
                }
            } catch (e) { }

        } catch (error) {
            clearInterval(spinner);
            messages.push({ role: 'assistant', content: `Error: ${error.message}` });
        }

        isProcessing = false;
        drawChat();
    }

    // Start the TUI
    drawWelcome();

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '',
        terminal: true
    });

    // Enable keypress events for Tab handling
    if (process.stdin.isTTY) {
        readline.emitKeypressEvents(process.stdin, rl);
        process.stdin.setRawMode(true);

        process.stdin.on('keypress', (ch, key) => {
            if (!key) return;

            // Handle Tab - toggle mode without affecting input
            if (key.name === 'tab') {
                handleModeToggle();
                return;
            }

            // Handle Ctrl+C - exit
            if (key.ctrl && key.name === 'c') {
                write(ansi.clear);
                write(ansi.moveTo(1, 1));
                write(ansi.show);
                process.exit(0);
            }

            // Handle Enter - submit input (readline handles this)
            // Handle other keys - let readline handle them
        });
    }

    // Handle line input
    rl.on('line', async (line) => {
        if (!isProcessing) {
            await processInput(line);
        }
    });

    // Handle close
    rl.on('close', () => {
        write(ansi.clear);
        write(ansi.moveTo(1, 1));
        write(ansi.show);
        process.exit(0);
    });
}

export default { startTUI };
