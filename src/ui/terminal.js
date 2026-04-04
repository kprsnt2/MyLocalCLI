import chalk from 'chalk';
import boxen from 'boxen';
import figures from 'figures';

// Rich terminal output utilities
export const colors = {
    primary: chalk.hex('#7C3AED'),
    secondary: chalk.hex('#06B6D4'),
    success: chalk.hex('#10B981'),
    warning: chalk.hex('#F59E0B'),
    error: chalk.hex('#EF4444'),
    info: chalk.hex('#3B82F6'),
    muted: chalk.gray,
    code: chalk.hex('#E879F9'),
    user: chalk.hex('#3B82F6'),
    assistant: chalk.hex('#10B981'),
    accent: chalk.hex('#F472B6'),
    nvidia: chalk.hex('#76B900'),
    dim: chalk.dim,
    bold: chalk.bold,
    underline: chalk.underline
};

export function printLogo() {
    const gradient = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#A78BFA', '#8B5CF6'];
    const logoLines = [
        '  ███╗   ███╗██╗      ██████╗ ',
        '  ████╗ ████║██║     ██╔════╝ ',
        '  ██╔████╔██║██║     ██║      ',
        '  ██║╚██╔╝██║██║     ██║      ',
        '  ██║ ╚═╝ ██║███████╗╚██████╗',
        '  ╚═╝     ╚═╝╚══════╝ ╚═════╝',
    ];
    for (let i = 0; i < logoLines.length; i++) {
        const color = gradient[i % gradient.length];
        console.log(chalk.hex(color).bold(logoLines[i]));
    }
    console.log(colors.muted('  Your Own AI Coding Assistant - Private, Local, Yours'));
    console.log(colors.dim(`  v${process.env.npm_package_version || '3.4.1'}`) + '\n');
}

export function printWelcome(provider, model) {
    const width = Math.min(process.stdout.columns || 60, 60);
    const line = colors.primary('─'.repeat(width));

    console.log(line);
    console.log(`  ${colors.success(figures.tick)} Provider  ${colors.secondary.bold(provider)}`);
    console.log(`  ${colors.success(figures.tick)} Model     ${colors.code(model)}`);
    console.log(`  ${colors.info(figures.info)} Type ${colors.primary('/help')} for commands, ${colors.primary('Tab')} to switch modes`);
    console.log(line + '\n');
}

export function printSection(title) {
    const width = Math.min(process.stdout.columns || 60, 60);
    console.log(`\n${colors.primary('━━━')} ${colors.primary.bold(title)} ${colors.primary('━'.repeat(Math.max(0, width - title.length - 6)))}\n`);
}

export function printConnectionStatus(name, connected, detail = '') {
    const icon = connected ? colors.success(figures.tick) : colors.error(figures.cross);
    const status = connected ? colors.success('connected') : colors.error('offline');
    const extra = detail ? colors.muted(` (${detail})`) : '';
    console.log(`  ${icon} ${name}: ${status}${extra}`);
}

export function printKeyValue(key, value, indent = 2) {
    const pad = ' '.repeat(indent);
    console.log(`${pad}${colors.muted(key + ':')} ${value}`);
}

export function printBanner(text, borderColor = '#7C3AED') {
    console.log(boxen(text, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor,
        dimBorder: false
    }));
}

export function printUserMessage(message) {
    console.log(`\n${colors.user(figures.arrowRight + ' You:')} ${message}`);
}

export function printAssistantStart() {
    process.stdout.write(`\n${colors.assistant(figures.arrowRight + ' Assistant:')} `);
}

export function printAssistantChunk(chunk) {
    process.stdout.write(chunk);
}

export function printAssistantEnd() {
    console.log('\n');
}

export function printError(message) {
    console.log(`\n${colors.error(figures.cross)} ${colors.error('Error:')} ${message}\n`);
}

export function printWarning(message) {
    console.log(`${colors.warning(figures.warning)} ${colors.warning('Warning:')} ${message}`);
}

export function printSuccess(message) {
    console.log(`${colors.success(figures.tick)} ${message}`);
}

export function printInfo(message) {
    console.log(`${colors.secondary(figures.info)} ${message}`);
}

export function printCommand(command) {
    console.log(boxen(command, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: '#F59E0B',
        title: 'Command',
        titleAlignment: 'left'
    }));
}

export function printCode(code, language = '') {
    console.log(boxen(code, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: '#E879F9',
        title: language || 'Code',
        titleAlignment: 'left'
    }));
}

export function printDivider() {
    console.log(colors.muted('─'.repeat(50)));
}

export function printHelp() {
    const commands = `
${colors.primary('Commands:')}
  ${colors.secondary('/help')}     - Show this help message
  ${colors.secondary('/clear')}    - Clear conversation history
  ${colors.secondary('/config')}   - Show current configuration
  ${colors.secondary('/provider')} - Switch AI provider
  ${colors.secondary('/model')}    - Switch model
  ${colors.secondary('/models')}   - List available models
  ${colors.secondary('/exit')}     - Exit MyLocalCLI

${colors.primary('Tips:')}
  ${figures.pointer} Ask about your code: "Explain this function"
  ${figures.pointer} Get help: "How do I fix this error?"
  ${figures.pointer} Run commands: "Run npm test"
  ${figures.pointer} Read files: "Show me the package.json"
`;
    console.log(commands);
}

export function printProvidersList(providers, current) {
    printSection('Available Providers');
    for (const [key, provider] of Object.entries(providers)) {
        const isCurrent = key === current;
        const marker = isCurrent ? colors.success(figures.tick) : colors.muted(figures.pointer);
        const name = isCurrent ? colors.primary.bold(provider.name) : provider.name;
        const keyLabel = isCurrent ? colors.success(`[${key}]`) : colors.muted(`[${key}]`);
        const apiNote = provider.requiresApiKey ? colors.warning(' (API key required)') : colors.success(' (no key needed)');
        console.log(`  ${marker} ${provider.icon} ${name} ${keyLabel}${apiNote}`);
        console.log(`    ${colors.muted(provider.description)}`);
    }
    console.log();
}

export function printModelsList(models) {
    printSection('Available Models');
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const num = colors.muted(`${(i + 1).toString().padStart(2)}.`);
        console.log(`  ${num} ${colors.code(model.id)} ${colors.muted(`- ${model.owned_by || 'unknown'}`)}`);
    }
    console.log(colors.muted(`\n  ${models.length} model(s) available\n`));
}

export default {
    colors,
    printLogo,
    printWelcome,
    printSection,
    printConnectionStatus,
    printKeyValue,
    printBanner,
    printUserMessage,
    printAssistantStart,
    printAssistantChunk,
    printAssistantEnd,
    printError,
    printWarning,
    printSuccess,
    printInfo,
    printCommand,
    printCode,
    printDivider,
    printHelp,
    printProvidersList,
    printModelsList
};
