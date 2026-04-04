import chalk from 'chalk';

// ── Gradient & Color Utilities ─────────────────────────────────

const GRADIENT_PURPLE = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#A78BFA', '#8B5CF6'];
const GRADIENT_CYBER  = ['#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#67E8F9', '#22D3EE'];
const GRADIENT_FIRE   = ['#EF4444', '#F97316', '#F59E0B', '#FBBF24', '#F59E0B', '#F97316'];
const GRADIENT_NEON   = ['#E879F9', '#F472B6', '#FB7185', '#F472B6', '#E879F9', '#C084FC'];
const GRADIENT_MATRIX = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#6EE7B7', '#34D399'];

export function gradientText(text, gradient = GRADIENT_PURPLE) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const color = gradient[i % gradient.length];
        result += chalk.hex(color)(text[i]);
    }
    return result;
}

export function rainbowText(text) {
    const rainbow = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += chalk.hex(rainbow[i % rainbow.length])(text[i]);
    }
    return result;
}

export function pulseColor(text, colors, frame) {
    const idx = frame % colors.length;
    return chalk.hex(colors[idx])(text);
}

// ── Animated Startup ───────────────────────────────────────────

const LOGO_LINES = [
    '  ███╗   ███╗██╗      ██████╗ ',
    '  ████╗ ████║██║     ██╔════╝ ',
    '  ██╔████╔██║██║     ██║      ',
    '  ██║╚██╔╝██║██║     ██║      ',
    '  ██║ ╚═╝ ██║███████╗╚██████╗',
    '  ╚═╝     ╚═╝╚══════╝ ╚═════╝',
];

export function animatedLogo() {
    return new Promise((resolve) => {
        let line = 0;
        const interval = setInterval(() => {
            if (line < LOGO_LINES.length) {
                const gradient = GRADIENT_PURPLE;
                console.log(gradientText(LOGO_LINES[line], gradient));
                line++;
            } else {
                clearInterval(interval);
                resolve();
            }
        }, 60);
    });
}

// ── Typing Animation ───────────────────────────────────────────

export function typeText(text, speed = 15) {
    return new Promise((resolve) => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                process.stdout.write(text[i]);
                i++;
            } else {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}

// ── Progress Bar ───────────────────────────────────────────────

export function progressBar(progress, width = 30, label = '') {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    const bar = chalk.hex('#7C3AED')('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const pct = chalk.bold(`${Math.round(progress * 100)}%`);
    const lbl = label ? chalk.gray(` ${label}`) : '';
    return `  ${bar} ${pct}${lbl}`;
}

export function animatedProgress(label, duration = 1500) {
    return new Promise((resolve) => {
        const width = 25;
        const steps = 20;
        const stepTime = duration / steps;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            const progress = step / steps;
            process.stdout.write(`\r${progressBar(progress, width, label)}`);
            if (step >= steps) {
                clearInterval(interval);
                process.stdout.write('\n');
                resolve();
            }
        }, stepTime);
    });
}

// ── Startup Sequence ───────────────────────────────────────────

const BOOT_STEPS = [
    { label: 'Loading core modules', icon: '⚡' },
    { label: 'Initializing tools (42)', icon: '🔧' },
    { label: 'Loading skills (38)', icon: '🧠' },
    { label: 'Connecting provider', icon: '🔌' },
    { label: 'Ready', icon: '✨' },
];

export async function animatedStartup(options = {}) {
    const { skipLogo = false, fast = false } = options;
    const delay = fast ? 40 : 100;

    if (!skipLogo) {
        await animatedLogo();
        await typeText(chalk.gray('  Your Own AI Coding Assistant - Private, Local, Yours\n'), fast ? 5 : 12);
        console.log(chalk.dim(`  v${process.env.npm_package_version || '3.4.1'}\n`));
    }

    for (const step of BOOT_STEPS) {
        process.stdout.write(chalk.gray(`  ${step.icon} ${step.label}...`));
        await sleep(delay + Math.random() * delay);
        process.stdout.write(`\r  ${chalk.hex('#10B981')('✔')} ${step.label}     \n`);
    }
    console.log();
}

// ── Tool Execution Animation ───────────────────────────────────

const TOOL_SPINNERS = {
    default:   { frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], interval: 80 },
    dots:      { frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'], interval: 80 },
    bounce:    { frames: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'], interval: 100 },
    pulse:     { frames: ['◜', '◠', '◝', '◞', '◡', '◟'], interval: 100 },
    arrows:    { frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'], interval: 100 },
    blocks:    { frames: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '▉', '▊', '▋', '▌', '▍', '▎'], interval: 80 },
    wave:      { frames: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'], interval: 80 },
};

const TOOL_ICONS = {
    read_file: '📖', write_file: '📝', edit_file: '✏️', delete_file: '🗑️',
    list_directory: '📂', search_files: '🔍', grep: '🔎', run_command: '⚡',
    git_status: '📊', git_diff: '📋', git_commit: '💾', git_branch: '🌿',
    test_run: '🧪', lint_check: '✅', web_fetch: '🌐', http_request: '📡',
    project_stats: '📈', json_query: '🔑', hash_file: '🔒',
    notebook: '📓', todo_write: '📋', codebase_search: '🔬',
    default: '🔧'
};

export function getToolIcon(toolName) {
    return TOOL_ICONS[toolName] || TOOL_ICONS.default;
}

export function toolSpinner(toolName, text) {
    const icon = getToolIcon(toolName);
    const spinner = TOOL_SPINNERS.dots;
    let frame = 0;
    let interval;

    return {
        start() {
            interval = setInterval(() => {
                const f = spinner.frames[frame % spinner.frames.length];
                const coloredFrame = pulseColor(f, GRADIENT_CYBER, frame);
                process.stdout.write(`\r  ${icon} ${coloredFrame} ${chalk.hex('#06B6D4')(text || toolName)}   `);
                frame++;
            }, spinner.interval);
        },
        succeed(msg) {
            clearInterval(interval);
            process.stdout.write(`\r  ${icon} ${chalk.hex('#10B981')('✔')} ${msg || text || toolName}     \n`);
        },
        fail(msg) {
            clearInterval(interval);
            process.stdout.write(`\r  ${icon} ${chalk.hex('#EF4444')('✘')} ${msg || text || toolName}     \n`);
        },
        stop() {
            clearInterval(interval);
            process.stdout.write('\r' + ' '.repeat(60) + '\r');
        }
    };
}

// ── Thinking Animation ─────────────────────────────────────────

export function thinkingAnimation() {
    const phases = [
        { frames: ['🤔 Thinking', '🤔 Thinking.', '🤔 Thinking..', '🤔 Thinking...'], color: '#7C3AED' },
        { frames: ['💭 Reasoning', '💭 Reasoning.', '💭 Reasoning..', '💭 Reasoning...'], color: '#8B5CF6' },
        { frames: ['🧠 Processing', '🧠 Processing.', '🧠 Processing..', '🧠 Processing...'], color: '#A78BFA' },
        { frames: ['✨ Generating', '✨ Generating.', '✨ Generating..', '✨ Generating...'], color: '#C4B5FD' },
    ];
    let phase = 0;
    let frame = 0;
    let interval;

    return {
        start() {
            interval = setInterval(() => {
                const p = phases[phase % phases.length];
                const f = p.frames[frame % p.frames.length];
                process.stdout.write(`\r  ${chalk.hex(p.color)(f)}   `);
                frame++;
                if (frame % p.frames.length === 0) phase++;
            }, 250);
        },
        stop() {
            clearInterval(interval);
            process.stdout.write('\r' + ' '.repeat(50) + '\r');
        }
    };
}

// ── Wipe / Transition Effects ──────────────────────────────────

export async function wipeTransition(direction = 'right') {
    const width = Math.min(process.stdout.columns || 60, 60);
    const block = '█';
    for (let i = 0; i <= width; i++) {
        const filled = direction === 'right' ? i : width - i;
        const line = chalk.hex('#7C3AED')(block.repeat(filled)) + ' '.repeat(width - filled);
        process.stdout.write(`\r  ${line}`);
        await sleep(8);
    }
    process.stdout.write(`\r${' '.repeat(width + 4)}\r`);
}

export async function sparkleTransition() {
    const width = Math.min(process.stdout.columns || 60, 60);
    const sparkles = ['✦', '✧', '✶', '✷', '✸', '✹', '✺', '⋆', '·'];
    for (let i = 0; i < 3; i++) {
        let line = '';
        for (let j = 0; j < width; j++) {
            line += chalk.hex(GRADIENT_NEON[j % GRADIENT_NEON.length])(sparkles[Math.floor(Math.random() * sparkles.length)]);
        }
        process.stdout.write(`\r  ${line}`);
        await sleep(100);
    }
    process.stdout.write(`\r${' '.repeat(width + 4)}\r`);
}

// ── Mode Switch Animation ──────────────────────────────────────

export async function animatedModeSwitch(modeName, modeType = 'agent') {
    const modes = modeType === 'agent'
        ? { build: { icon: '🔨', label: 'BUILD', color: '#10B981' }, plan: { icon: '📋', label: 'PLAN', color: '#3B82F6' } }
        : { smart: { icon: '🧠', label: 'SMART', color: '#8B5CF6' }, rush: { icon: '⚡', label: 'RUSH', color: '#F59E0B' } };

    const mode = modes[modeName];
    if (!mode) return;

    const width = process.stdout.columns || 60;
    const text = `${mode.icon} ${mode.label} MODE`;
    const boxWidth = text.length + 6;
    const pad = Math.floor((width - boxWidth) / 2);
    const sp = ' '.repeat(Math.max(0, pad));

    // Flash animation
    for (let i = 0; i < 2; i++) {
        process.stdout.write(`\r${sp}${chalk.hex(mode.color).inverse(`  ${text}  `)}`);
        await sleep(120);
        process.stdout.write(`\r${sp}${' '.repeat(boxWidth + 4)}`);
        await sleep(80);
    }

    // Final display
    console.log();
    console.log(`${sp}${chalk.hex(mode.color)(`╭${'─'.repeat(boxWidth)}╮`)}`);
    console.log(`${sp}${chalk.hex(mode.color)(`│  ${text}  │`)}`);
    console.log(`${sp}${chalk.hex(mode.color)(`╰${'─'.repeat(boxWidth)}╯`)}`);
    console.log();
}

// ── Session Summary Animation ──────────────────────────────────

export async function animatedSessionSummary(stats) {
    const { tokens = 0, cost = '0.00', duration = '0', messages = 0, tools = 0 } = stats;

    console.log();
    await wipeTransition('right');
    console.log(gradientText('  ━━━ Session Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━', GRADIENT_PURPLE));
    console.log();

    const items = [
        { icon: '💬', label: 'Messages', value: String(messages) },
        { icon: '🔧', label: 'Tool calls', value: String(tools) },
        { icon: '📊', label: 'Tokens', value: String(tokens) },
        { icon: '💰', label: 'Cost', value: `$${cost}` },
        { icon: '⏱️', label: 'Duration', value: `${duration}s` },
    ];

    for (const item of items) {
        await sleep(80);
        console.log(`  ${item.icon}  ${chalk.gray(item.label.padEnd(12))} ${chalk.bold(item.value)}`);
    }

    console.log();
    console.log(gradientText('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', GRADIENT_PURPLE));
    console.log();
}

// ── Utility ────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export {
    GRADIENT_PURPLE,
    GRADIENT_CYBER,
    GRADIENT_FIRE,
    GRADIENT_NEON,
    GRADIENT_MATRIX,
    sleep
};

export default {
    gradientText,
    rainbowText,
    pulseColor,
    animatedLogo,
    typeText,
    progressBar,
    animatedProgress,
    animatedStartup,
    toolSpinner,
    getToolIcon,
    thinkingAnimation,
    wipeTransition,
    sparkleTransition,
    animatedModeSwitch,
    animatedSessionSummary,
    sleep
};
