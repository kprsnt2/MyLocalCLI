// MyLocalCLI - OpenCode-style TUI (Terminal User Interface)
// World-class terminal interface with professional polish

import readline from 'readline';
import { getAgentMode, getPerformanceMode, toggleAgentMode, isToolAllowed } from '../core/modes.js';
import { getProvider, getModel, getApiKey, getBaseUrl } from '../config/settings.js';
import { createProvider } from '../core/chat.js';
import { TOOLS, executeTool, parseToolCalls, initializeSkills } from '../core/tools.js';
import { getRelevantContext, formatContextForPrompt } from '../core/context.js';
import { loadProjectConfig, formatProjectConfigForPrompt } from '../config/project.js';
import { saveMessage, generateSessionId } from '../utils/history.js';
import { commandRegistry } from '../core/commandRegistry.js';

// ANSI escape codes
const ESC = '\x1b';
const CSI = `${ESC}[`;

const ansi = {
    // Cursor control
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    moveTo: (row, col) => `${CSI}${row};${col}H`,
    savePos: `${CSI}s`,
    restorePos: `${CSI}u`,

    // Screen control
    clear: `${CSI}2J`,
    clearLine: `${CSI}2K`,
    clearToEnd: `${CSI}K`,
    altScreen: `${CSI}?1049h`,
    mainScreen: `${CSI}?1049l`,
    setTitle: (title) => `${ESC}]0;${title}\x07`,

    // Text styles
    reset: `${CSI}0m`,
    bold: `${CSI}1m`,
    dim: `${CSI}2m`,
    italic: `${CSI}3m`,
    underline: `${CSI}4m`,
    blink: `${CSI}5m`,
    inverse: `${CSI}7m`,

    // Foreground colors (256-color support)
    black: `${CSI}30m`,
    red: `${CSI}31m`,
    green: `${CSI}32m`,
    yellow: `${CSI}33m`,
    blue: `${CSI}34m`,
    magenta: `${CSI}35m`,
    cyan: `${CSI}36m`,
    white: `${CSI}37m`,
    gray: `${CSI}90m`,
    brightRed: `${CSI}91m`,
    brightGreen: `${CSI}92m`,
    brightYellow: `${CSI}93m`,
    brightBlue: `${CSI}94m`,
    brightMagenta: `${CSI}95m`,
    brightCyan: `${CSI}96m`,
    brightWhite: `${CSI}97m`,

    // RGB colors
    rgb: (r, g, b) => `${CSI}38;2;${r};${g};${b}m`,
    bgRgb: (r, g, b) => `${CSI}48;2;${r};${g};${b}m`,

    // Background colors
    bgBlack: `${CSI}40m`,
    bgRed: `${CSI}41m`,
    bgGreen: `${CSI}42m`,
    bgBlue: `${CSI}44m`,
    bgGray: `${CSI}100m`,
};

// Color palette (modern dark theme)
const theme = {
    primary: ansi.rgb(124, 58, 237),      // Purple
    secondary: ansi.rgb(6, 182, 212),     // Cyan
    accent: ansi.rgb(236, 72, 153),       // Pink
    success: ansi.rgb(34, 197, 94),       // Green
    warning: ansi.rgb(234, 179, 8),       // Yellow
    error: ansi.rgb(239, 68, 68),         // Red
    muted: ansi.rgb(100, 116, 139),       // Slate
    text: ansi.rgb(226, 232, 240),        // Light
    dim: ansi.rgb(71, 85, 105),           // Dark slate
    border: ansi.rgb(51, 65, 85),         // Border color
    highlight: ansi.rgb(30, 41, 59),      // Highlight bg
};

const c = (color, text) => `${color}${text}${ansi.reset}`;
const write = (text) => process.stdout.write(text);

// Beautiful ASCII Logo with gradient effect
const LOGO = [
    '                                                            ',
    '  ███╗   ███╗██╗   ██╗██╗      ██████╗  ██████╗ █████╗ ██╗  ',
    '  ████╗ ████║╚██╗ ██╔╝██║     ██╔═══██╗██╔════╝██╔══██╗██║  ',
    '  ██╔████╔██║ ╚████╔╝ ██║     ██║   ██║██║     ███████║██║  ',
    '  ██║╚██╔╝██║  ╚██╔╝  ██║     ██║   ██║██║     ██╔══██║██║  ',
    '  ██║ ╚═╝ ██║   ██║   ███████╗╚██████╔╝╚██████╗██║  ██║███████╗',
    '  ╚═╝     ╚═╝   ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝',
    '                                                            ',
];

// Smaller logo for compact mode
const LOGO_COMPACT = [
    '  ╔╦╗╦ ╦╦  ╔═╗╔═╗╔═╗╦  ╔═╗╦  ╦',
    '  ║║║╚╦╝║  ║ ║║  ╠═╣║  ║  ║  ║',
    '  ╩ ╩ ╩ ╩═╝╚═╝╚═╝╩ ╩╩═╝╚═╝╩═╝╩',
];

const getSize = () => ({
    cols: process.stdout.columns || 100,
    rows: process.stdout.rows || 30
});

// Welcome tips - shown randomly on startup
const WELCOME_TIPS = [
    '💡 Tip: Type "tab" to switch between BUILD and PLAN modes',
    '💡 Tip: Use "$ cmd" to run shell commands directly',
    '💡 Tip: Type "/help" to see all available commands',
    '💡 Tip: In PLAN mode, file modifications are blocked for safety',
    '💡 Tip: Use "/clear" to start a fresh conversation',
    '💡 Tip: Press Ctrl+L to refresh the screen',
    '💡 Tip: Type "/mode" to see your current modes',
    '💡 Tip: Use "$$ cmd" for incognito shell (AI won\'t see output)',
    '💡 Tip: Use "/pin file.js" to always include a file in context',
    '💡 Tip: Try "@oracle query" to invoke the search subagent',
    '💡 Tip: Use "/init react" to set up project-specific config',
];

// Input history for arrow key navigation
const inputHistory = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

function addToHistory(input) {
    if (input.trim() && input !== inputHistory[0]) {
        inputHistory.unshift(input);
        if (inputHistory.length > MAX_HISTORY) {
            inputHistory.pop();
        }
    }
    historyIndex = -1;
}

function getFromHistory(direction) {
    if (direction === 'up' && historyIndex < inputHistory.length - 1) {
        historyIndex++;
        return inputHistory[historyIndex] || '';
    } else if (direction === 'down' && historyIndex > -1) {
        historyIndex--;
        return historyIndex >= 0 ? inputHistory[historyIndex] : '';
    }
    return null;
}

// Context window indicator
const CONTEXT_LIMIT = 128000; // tokens

function drawContextIndicator(tokens, row, col) {
    const percent = Math.min(100, Math.floor((tokens / CONTEXT_LIMIT) * 100));
    const barWidth = 20;
    const filled = Math.floor((percent / 100) * barWidth);

    // Color based on usage
    let barColor = theme.success;
    if (percent > 70) barColor = theme.warning;
    if (percent > 90) barColor = theme.error;

    write(ansi.moveTo(row, col));
    write(c(theme.dim, '⟨'));
    write(c(barColor, '█'.repeat(filled)));
    write(c(theme.dim, '░'.repeat(barWidth - filled)));
    write(c(theme.dim, '⟩ '));
    write(c(barColor, `${percent}%`));
}

// Progress bar for operations
function drawProgressBar(row, col, percent, label = '') {
    const { cols } = getSize();
    const barWidth = Math.min(40, cols - col - 15);
    const filled = Math.floor((percent / 100) * barWidth);

    write(ansi.moveTo(row, col));
    write(c(theme.muted, label + ' '));
    write(c(theme.dim, '['));
    write(c(theme.primary, '▓'.repeat(filled)));
    write(c(theme.dim, '░'.repeat(barWidth - filled)));
    write(c(theme.dim, '] '));
    write(c(theme.text, `${percent}%`));
}

// Unicode box characters for premium look
const box = {
    tl: '╭', tr: '╮', bl: '╰', br: '╯',
    h: '─', v: '│',
    // Double line version
    dtl: '╔', dtr: '╗', dbl: '╚', dbr: '╝',
    dh: '═', dv: '║',
};

// Draw beautiful rounded box
function drawBox(row, col, width, height, style = 'rounded') {
    const chars = style === 'double' ?
        { tl: box.dtl, tr: box.dtr, bl: box.dbl, br: box.dbr, h: box.dh, v: box.dv } :
        { tl: box.tl, tr: box.tr, bl: box.bl, br: box.br, h: box.h, v: box.v };

    write(ansi.moveTo(row, col));
    write(c(theme.border, chars.tl + chars.h.repeat(width - 2) + chars.tr));

    for (let i = 1; i < height - 1; i++) {
        write(ansi.moveTo(row + i, col));
        write(c(theme.border, chars.v));
        write(' '.repeat(width - 2));
        write(c(theme.border, chars.v));
    }

    write(ansi.moveTo(row + height - 1, col));
    write(c(theme.border, chars.bl + chars.h.repeat(width - 2) + chars.br));
}

// Draw gradient text (simulated with color transitions)
function drawGradientText(row, col, text, startColor, endColor) {
    const colors = [
        ansi.rgb(124, 58, 237),   // Purple
        ansi.rgb(99, 102, 241),   // Indigo
        ansi.rgb(59, 130, 246),   // Blue
        ansi.rgb(6, 182, 212),    // Cyan
    ];

    write(ansi.moveTo(row, col));
    const chars = text.split('');
    chars.forEach((char, i) => {
        const colorIndex = Math.floor((i / chars.length) * colors.length);
        write(c(colors[colorIndex], char));
    });
}

// Draw status bar with modern styling
function drawStatusBar(mode, perfMode, model, showThinking = false) {
    const { cols, rows } = getSize();
    const modeIcon = mode === 'build' ? '🔨' : '📋';
    const perfIcon = perfMode === 'smart' ? '🧠' : '⚡';

    // Background bar
    write(ansi.moveTo(rows, 1));
    write(c(theme.highlight, ' '.repeat(cols)));

    // Left section - mode with icon
    write(ansi.moveTo(rows, 2));
    if (showThinking) {
        write(c(theme.warning, '⠋ '));
        write(c(theme.muted, 'thinking... '));
    }

    // Center section
    const centerInfo = `${mode.charAt(0).toUpperCase() + mode.slice(1)}  •  ${model}  •  ${perfMode.charAt(0).toUpperCase() + perfMode.slice(1)}`;
    const centerPos = Math.floor((cols - centerInfo.length) / 2);
    write(ansi.moveTo(rows, centerPos));

    const modeColor = mode === 'build' ? theme.success : theme.secondary;
    const perfColor = perfMode === 'smart' ? theme.accent : theme.warning;

    write(c(ansi.bold, c(modeColor, mode.charAt(0).toUpperCase() + mode.slice(1))));
    write(c(theme.muted, '  •  '));
    write(c(theme.text, model));
    write(c(theme.muted, '  •  '));
    write(c(ansi.bold, c(perfColor, perfMode.charAt(0).toUpperCase() + perfMode.slice(1))));

    // Right section - shortcuts
    write(ansi.moveTo(rows, cols - 38));
    write(c(theme.dim, 'tab '));
    write(c(theme.text, 'mode'));
    write(c(theme.dim, '  •  '));
    write(c(theme.dim, '/help '));
    write(c(theme.text, 'cmds'));
    write(c(theme.dim, '  •  '));
    write(c(theme.dim, 'ctrl+c '));
    write(c(theme.text, 'exit'));
}

// Draw title bar with token counter
function drawTitleBar(title, tokens, cost = 0) {
    const { cols } = getSize();

    // Background
    write(ansi.moveTo(1, 1));
    write(c(theme.highlight, ' '.repeat(cols)));

    // Title with icon
    write(ansi.moveTo(1, 3));
    write(c(theme.primary, '◆ '));
    write(c(ansi.bold, c(theme.text, title || 'New Conversation')));

    // Context indicator in center-right
    drawContextIndicator(tokens, 1, cols - 50);

    // Token counter on right
    write(ansi.moveTo(1, cols - 22));
    write(c(theme.muted, `${tokens.toLocaleString()} tk`));
}

// Draw beautiful input box
function drawInputBox(row, placeholder, mode, currentInput = '') {
    const { cols } = getSize();
    const boxWidth = Math.min(cols - 6, 75);
    const boxCol = Math.floor((cols - boxWidth) / 2);

    // Draw rounded box
    drawBox(row, boxCol, boxWidth, 4, 'rounded');

    // Input text or placeholder
    write(ansi.moveTo(row + 1, boxCol + 3));
    if (currentInput) {
        write(c(theme.text, currentInput.slice(-(boxWidth - 6))));
    } else {
        write(c(theme.muted, placeholder || 'Ask anything... "Fix broken tests"'));
    }

    // Mode badge with icon
    write(ansi.moveTo(row + 2, boxCol + 3));
    const modeColor = mode === 'build' ? theme.success : theme.secondary;
    const modeIcon = mode === 'build' ? '🔨' : '📋';
    write(c(ansi.bold, c(modeColor, mode.toUpperCase())));
    write(c(theme.dim, '  ← press tab to switch'));

    return { row, boxCol, boxWidth, inputRow: row + 1, inputCol: boxCol + 3 };
}

// Syntax highlighting for code blocks
function highlightCode(code, language = '') {
    // Simple syntax highlighting
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'async', 'await', 'try', 'catch'];
    const types = ['string', 'number', 'boolean', 'Array', 'Object', 'Promise'];

    let result = code;

    // Highlight strings
    result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, match =>
        c(theme.success, match)
    );

    // Highlight keywords
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'g');
        result = result.replace(regex, c(theme.accent, kw));
    });

    // Highlight numbers
    result = result.replace(/\b\d+\.?\d*\b/g, match =>
        c(theme.warning, match)
    );

    return result;
}

// Draw messages with syntax highlighting
function drawMessages(messages, startRow, maxRows, cols) {
    let row = startRow;

    // Clear message area
    for (let r = startRow; r < startRow + maxRows; r++) {
        write(ansi.moveTo(r, 1));
        write(ansi.clearLine);
    }

    const displayMsgs = messages.slice(-10);

    for (const msg of displayMsgs) {
        if (row >= startRow + maxRows - 2) break;

        if (msg.role === 'user') {
            write(ansi.moveTo(row, 3));
            write(c(theme.secondary, '▶ '));
            write(c(theme.text, msg.content.slice(0, cols - 10)));
            row++;
        } else if (msg.role === 'tool') {
            write(ansi.moveTo(row, 3));
            write(c(theme.warning, '⚡ '));
            write(c(theme.muted, msg.content.slice(0, cols - 10)));
            row++;
        } else {
            // Assistant response with formatting
            const lines = msg.content.split('\n');
            let inCodeBlock = false;

            for (let i = 0; i < Math.min(lines.length, 12) && row < startRow + maxRows - 2; i++) {
                const line = lines[i];
                write(ansi.moveTo(row, 3));

                // Detect code blocks
                if (line.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                    write(c(theme.dim, line.slice(0, cols - 6)));
                } else if (inCodeBlock) {
                    write(c(theme.dim, '│ '));
                    write(highlightCode(line.slice(0, cols - 10)));
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    write(c(theme.accent, '• '));
                    write(c(theme.text, line.slice(2, cols - 8)));
                } else if (line.startsWith('#')) {
                    write(c(ansi.bold, c(theme.primary, line.slice(0, cols - 6))));
                } else {
                    write(c(theme.text, line.slice(0, cols - 6)));
                }
                row++;
            }

            if (lines.length > 12) {
                write(ansi.moveTo(row, 3));
                write(c(theme.dim, `  ⋮ ${lines.length - 12} more lines`));
                row++;
            }
        }
        row++; // Space between messages
    }

    return row;
}

// Animated thinking indicator
let thinkingFrame = 0;
const thinkingFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function drawThinking(row) {
    write(ansi.moveTo(row, 5));
    write(c(theme.warning, thinkingFrames[thinkingFrame]));
    write(c(theme.muted, ' Thinking...'));
    thinkingFrame = (thinkingFrame + 1) % thinkingFrames.length;
}

// Main TUI
export async function startTUI(options = {}) {
    await initializeSkills();
    const { cols, rows } = getSize();
    const cwd = options.cwd || process.cwd();
    const providerName = getProvider();
    let provider;

    try {
        provider = createProvider(providerName);
    } catch (e) { }

    const modelName = getModel(providerName) || 'Local Model';
    const sessionId = generateSessionId();

    let messages = [];
    let tokens = 0;
    let title = '';
    let isProcessing = false;
    let currentScreen = 'welcome';
    let inputBoxInfo = null;
    let thinkingInterval = null;

    // Switch to alternate screen buffer for clean UI
    write(ansi.altScreen);
    write(ansi.setTitle('MyLocalCLI'));
    write(ansi.hide);

    // Handle terminal resize - redraw the screen
    process.stdout.on('resize', () => {
        if (currentScreen === 'welcome') {
            drawWelcome();
        } else {
            drawChat();
        }
    });

    // Cleanup function
    function cleanup() {
        if (thinkingInterval) clearInterval(thinkingInterval);
        write(ansi.mainScreen);
        write(ansi.show);
        process.exit(0);
    }

    // Handle process exit
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Draw welcome screen
    function drawWelcome() {
        currentScreen = 'welcome';
        const { cols, rows } = getSize();

        write(ansi.clear);

        // Choose logo based on terminal width
        const logo = cols >= 70 ? LOGO : LOGO_COMPACT;

        // Draw logo with gradient colors
        const logoRow = Math.floor(rows / 3) - logo.length / 2;
        logo.forEach((line, i) => {
            const col = Math.floor((cols - line.length) / 2);
            write(ansi.moveTo(logoRow + i, col));
            drawGradientText(logoRow + i, col, line);
        });

        // Subtitle
        const subtitle = 'Your Private AI Coding Assistant';
        write(ansi.moveTo(logoRow + logo.length + 1, Math.floor((cols - subtitle.length) / 2)));
        write(c(theme.muted, subtitle));

        // Welcome tip
        const tip = WELCOME_TIPS[Math.floor(Math.random() * WELCOME_TIPS.length)];
        write(ansi.moveTo(logoRow + logo.length + 3, Math.floor((cols - tip.length) / 2)));
        write(c(theme.dim, tip));

        // Input box
        const mode = getAgentMode();
        const inputRow = logoRow + logo.length + 6;
        inputBoxInfo = drawInputBox(inputRow, 'Ask anything... "Fix broken tests"', mode.name, '');

        // Status bar
        const perfMode = getPerformanceMode();
        drawStatusBar(mode.name, perfMode.name, modelName);

        // Version badge
        write(ansi.moveTo(rows - 1, cols - 10));
        write(c(theme.dim, 'v3.4.0'));

        // Position cursor
        write(ansi.moveTo(inputBoxInfo.inputRow, inputBoxInfo.inputCol));
        write(ansi.show);
    }

    // Draw chat screen
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
        drawStatusBar(mode.name, perfMode.name, modelName, isProcessing);

        // Position cursor
        write(ansi.moveTo(inputBoxInfo.inputRow, inputBoxInfo.inputCol));
        write(ansi.show);
    }

    // Handle mode toggle
    function handleModeToggle() {
        toggleAgentMode();
        if (currentScreen === 'welcome') {
            drawWelcome();
        } else {
            drawChat();
        }
    }

    // Process user input
    async function processInput(input) {
        if (!input.trim()) return;

        // Commands
        if (input.trim().startsWith('/')) {
            const context = { messages, tokens, title, drawWelcome, drawChat, cleanup };
            const result = await commandRegistry.execute(input, context);
            
            if (result.action === 'exit') {
                cleanup();
            } else if (result.action === 'clearChat') {
                messages.length = 0; // Clear the array in place if possible, or trigger clean
                tokens = 0;
                title = '';
                drawWelcome();
            } else if (result.action === 'drawChat') {
                drawChat();
            }
            return;
        }

        // Shell commands
        if (input.startsWith('$')) {
            const cmd = input.slice(input.startsWith('$$') ? 2 : 1).trim();
            messages.push({ role: 'tool', content: `Running: ${cmd}` });
            drawChat();
            return;
        }

        // Set title
        if (!title) {
            title = input.slice(0, 50);
        }

        // Add user message
        messages.push({ role: 'user', content: input });
        tokens += input.length;

        isProcessing = true;
        drawChat();

        // Start thinking animation
        const { rows } = getSize();
        thinkingInterval = setInterval(() => drawThinking(rows - 8), 80);

        try {
            if (!provider) {
                throw new Error('No AI provider configured.\n\nRun: mylocalcli init');
            }

            const mode = getAgentMode();
            let systemContent = `You are MyLocalCLI, a professional AI coding assistant.

Working directory: ${cwd}
Current mode: ${mode.displayName}
${mode.name === 'plan' ? 'READ-ONLY MODE: Do not suggest file modifications.' : ''}

Guidelines:
- Be concise and helpful
- Use markdown formatting
- Format code with \`\`\` blocks
- Use bullet points for lists`;

            try {
                const projectConfig = await loadProjectConfig(cwd);
                if (projectConfig) {
                    systemContent += '\n\n' + formatProjectConfigForPrompt(projectConfig);
                }
            } catch (e) { }

            const messagesWithSystem = [
                { role: 'system', content: systemContent },
                ...messages.filter(m => m.role === 'user' || m.role === 'assistant')
            ];

            let fullResponse = '';
            for await (const chunk of provider.stream(messagesWithSystem, {})) {
                fullResponse += chunk;
            }

            clearInterval(thinkingInterval);
            thinkingInterval = null;

            messages.push({ role: 'assistant', content: fullResponse });
            tokens += fullResponse.length;

            // Handle tool calls
            try {
                const toolCalls = parseToolCalls(fullResponse);
                for (const tool of toolCalls) {
                    if (!isToolAllowed(tool.name)) {
                        messages.push({ role: 'tool', content: `🚫 ${tool.name} blocked in ${mode.displayName}` });
                    } else {
                        messages.push({ role: 'tool', content: `⚡ ${tool.name}` });
                        try {
                            await executeTool(tool.name, tool.arguments, cwd);
                            messages.push({ role: 'tool', content: `✓ ${tool.name} completed` });
                        } catch (e) {
                            messages.push({ role: 'tool', content: `✗ ${tool.name}: ${e.message}` });
                        }
                    }
                }
            } catch (e) { }

        } catch (error) {
            if (thinkingInterval) clearInterval(thinkingInterval);
            messages.push({ role: 'assistant', content: `**Error**\n\n${error.message}` });
        }

        isProcessing = false;
        drawChat();
    }

    // Start
    drawWelcome();

    // Setup readline
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '',
        terminal: true
    });

    // Keypress handling
    if (process.stdin.isTTY) {
        readline.emitKeypressEvents(process.stdin, rl);
        process.stdin.setRawMode(true);

        process.stdin.on('keypress', (ch, key) => {
            if (!key) return;

            if (key.name === 'tab') {
                handleModeToggle();
                return;
            }

            if (key.ctrl && key.name === 'c') {
                cleanup();
            }

            if (key.ctrl && key.name === 'l') {
                if (currentScreen === 'welcome') drawWelcome();
                else drawChat();
            }
        });
    }

    rl.on('line', async (line) => {
        if (!isProcessing && line.trim()) {
            addToHistory(line);
            await processInput(line);
        }
    });

    rl.on('close', cleanup);
}

export default { startTUI };
