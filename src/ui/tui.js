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

// Draw box
function drawBox(row, col, width, height) {
    write(ansi.moveTo(row, col));
    write(c('gray', '┌' + '─'.repeat(width - 2) + '┐'));
    for (let i = 1; i < height - 1; i++) {
        write(ansi.moveTo(row + i, col));
        write(c('gray', '│'));
        write(ansi.moveTo(row + i, col + width - 1));
        write(c('gray', '│'));
    }
    write(ansi.moveTo(row + height - 1, col));
    write(c('gray', '└' + '─'.repeat(width - 2) + '┘'));
}

// Status bar
function drawStatusBar(mode, perfMode, model) {
    const { cols, rows } = getSize();
    const modeColor = mode === 'build' ? 'green' : 'blue';
    const perfColor = perfMode === 'smart' ? 'magenta' : 'yellow';

    write(ansi.moveTo(rows, 1));
    write(ansi.clearLine);

    // Left
    write(c('gray', '  '));

    // Center
    const centerPos = Math.floor(cols / 2) - 20;
    write(ansi.moveTo(rows, centerPos));
    write(c('bold', c(modeColor, mode.charAt(0).toUpperCase() + mode.slice(1))));
    write(c('white', '  ' + model + '  '));
    write(c(perfColor, perfMode.charAt(0).toUpperCase() + perfMode.slice(1)));

    // Right
    write(ansi.moveTo(rows, cols - 35));
    write(c('gray', 'tab '));
    write(c('white', 'switch mode'));
    write(c('gray', '  /help '));
    write(c('white', 'commands'));
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

// Draw messages
function drawMessages(messages, startRow, maxRows) {
    const { cols } = getSize();
    let row = startRow;

    // Show last messages that fit
    const displayMsgs = messages.slice(-10);

    for (const msg of displayMsgs) {
        if (row >= startRow + maxRows - 2) break;

        write(ansi.moveTo(row, 3));
        write(ansi.clearLine);

        if (msg.role === 'user') {
            write(c('cyan', '> '));
            write(c('white', msg.content.slice(0, cols - 10)));
        } else if (msg.role === 'tool') {
            write(c('yellow', '✦ '));
            write(c('gray', msg.content.slice(0, cols - 10)));
        } else {
            // Assistant - show truncated
            const lines = msg.content.split('\n');
            for (let i = 0; i < Math.min(lines.length, 8) && row < startRow + maxRows - 2; i++) {
                write(ansi.moveTo(row, 3));
                write(ansi.clearLine);
                write(lines[i].slice(0, cols - 6));
                row++;
            }
            if (lines.length > 8) {
                write(ansi.moveTo(row, 3));
                write(c('gray', `  ... (${lines.length - 8} more lines)`));
                row++;
            }
            continue;
        }
        row++;
    }

    // Clear remaining rows
    while (row < startRow + maxRows) {
        write(ansi.moveTo(row, 3));
        write(ansi.clearLine);
        row++;
    }
}

// Main TUI
export async function startTUI(options = {}) {
    const { cols, rows } = getSize();
    const cwd = options.cwd || process.cwd();
    const providerName = getProvider();
    const provider = createProvider(providerName);
    const modelName = getModel(providerName) || 'Local LLM';
    const sessionId = generateSessionId();

    let messages = [];
    let tokens = 0;
    let title = '';
    let isProcessing = false;

    // Clear screen and draw welcome
    function drawWelcome() {
        write(ansi.clear);

        // Logo centered
        const logoRow = Math.floor(rows / 3);
        LOGO.forEach((line, i) => {
            const col = Math.floor((cols - 32) / 2);
            write(ansi.moveTo(logoRow + i, col));
            write(c('cyan', line));
        });

        // Input prompt
        const inputRow = logoRow + LOGO.length + 2;
        const boxWidth = Math.min(cols - 10, 70);
        const boxCol = Math.floor((cols - boxWidth) / 2);

        drawBox(inputRow, boxCol, boxWidth, 4);

        write(ansi.moveTo(inputRow + 1, boxCol + 3));
        write(c('gray', 'Ask anything... "Fix broken tests"'));

        // Mode indicator
        const mode = getAgentMode();
        write(ansi.moveTo(inputRow + 2, boxCol + 3));
        const modeColor = mode.name === 'build' ? 'green' : 'blue';
        write(c('bold', c(modeColor, mode.displayName)));

        // Status bar
        const perfMode = getPerformanceMode();
        drawStatusBar(mode.name, perfMode.name, modelName);

        // Version
        write(ansi.moveTo(rows - 1, cols - 8));
        write(c('gray', 'v3.3.0'));

        return { inputRow: inputRow + 1, boxCol: boxCol + 3, boxWidth: boxWidth - 6 };
    }

    // Draw chat screen
    function drawChat() {
        write(ansi.clear);

        // Title bar
        drawTitleBar(title, tokens);

        // Messages
        const msgAreaStart = 3;
        const msgAreaHeight = rows - 8;
        drawMessages(messages, msgAreaStart, msgAreaHeight);

        // Status bar
        const mode = getAgentMode();
        const perfMode = getPerformanceMode();
        drawStatusBar(mode.name, perfMode.name, modelName);
    }

    // Show spinner
    function showThinking() {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        return setInterval(() => {
            write(ansi.moveTo(rows - 2, 3));
            write(c('yellow', `${frames[i]} Thinking...`));
            write(ansi.clearLine);
            i = (i + 1) % frames.length;
        }, 80);
    }

    // Process user input with AI
    async function processInput(input) {
        if (!input.trim()) return;

        // Special commands
        if (input.trim() === '/exit' || input.trim() === '/quit') {
            write(ansi.clear);
            write(ansi.moveTo(1, 1));
            process.exit(0);
        }

        if (input.trim() === '/help') {
            messages.push({
                role: 'assistant', content:
                    'Commands:\n' +
                    '/exit - Exit\n' +
                    '/clear - Clear conversation\n' +
                    'tab - Switch mode (build/plan)\n' +
                    '$ <cmd> - Run shell command'
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

        // Handle shell commands
        if (input.startsWith('$')) {
            const cmd = input.slice(input.startsWith('$$') ? 2 : 1).trim();
            messages.push({ role: 'tool', content: `Shell: ${cmd}` });
            drawChat();
            return;
        }

        // Set title
        if (!title) {
            title = input.slice(0, 40);
        }

        // Add user message
        messages.push({ role: 'user', content: input });
        tokens += input.length;
        await saveMessage(sessionId, { role: 'user', content: input });

        isProcessing = true;
        drawChat();

        const spinner = showThinking();

        try {
            // Get context
            const context = await getRelevantContext(cwd, input);
            const projectConfig = await loadProjectConfig(cwd);

            // Build system prompt
            let systemContent = `You are MyLocalCLI, an AI coding assistant.
Working directory: ${cwd}

Be concise and helpful. Format code with markdown.`;

            if (projectConfig) {
                systemContent += '\n\n' + formatProjectConfigForPrompt(projectConfig);
            }

            // Call AI
            const messagesWithSystem = [
                { role: 'system', content: systemContent },
                ...messages.filter(m => m.role === 'user' || m.role === 'assistant')
            ];

            let fullResponse = '';

            for await (const chunk of provider.stream(messagesWithSystem, {})) {
                fullResponse += chunk;

                // Update display periodically
                if (fullResponse.length % 50 === 0) {
                    clearInterval(spinner);
                    messages[messages.length] = { role: 'assistant', content: fullResponse + '▌' };
                    drawChat();
                }
            }

            clearInterval(spinner);

            // Final response
            messages.push({ role: 'assistant', content: fullResponse });
            tokens += fullResponse.length;
            await saveMessage(sessionId, { role: 'assistant', content: fullResponse });

            // Handle tool calls
            const toolCalls = parseToolCalls(fullResponse);
            for (const tool of toolCalls) {
                const mode = getAgentMode();
                if (!isToolAllowed(tool.name)) {
                    messages.push({ role: 'tool', content: `🚫 ${tool.name} blocked in ${mode.displayName} mode` });
                } else {
                    messages.push({ role: 'tool', content: `✦ ${tool.name}...` });
                    const result = await executeTool(tool.name, tool.arguments, cwd);
                    messages.push({ role: 'tool', content: result.success ? `✓ ${tool.name} done` : `✗ ${tool.name} failed` });
                }
            }

        } catch (error) {
            clearInterval(spinner);
            messages.push({ role: 'assistant', content: `Error: ${error.message}` });
        }

        isProcessing = false;
        drawChat();
    }

    // Start
    const welcomePos = drawWelcome();

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // Position cursor
    write(ansi.moveTo(welcomePos.inputRow, welcomePos.boxCol));

    // Handle Tab key for mode switching
    if (process.stdin.isTTY) {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.on('keypress', (ch, key) => {
            if (key && key.name === 'tab') {
                toggleAgentMode();
                if (messages.length === 0) {
                    drawWelcome();
                } else {
                    drawChat();
                }
            }
        });
    }

    // Handle input
    rl.on('line', async (line) => {
        if (!isProcessing) {
            await processInput(line);

            // Re-prompt
            write(ansi.moveTo(rows - 3, 3));
            write(c('gray', '> '));
        }
    });

    // Handle close
    rl.on('close', () => {
        write(ansi.clear);
        write(ansi.moveTo(1, 1));
        process.exit(0);
    });
}

export default { startTUI };
