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
    muted: chalk.gray,
    code: chalk.hex('#E879F9'),
    user: chalk.hex('#3B82F6'),
    assistant: chalk.hex('#10B981')
};

export function printLogo() {
    const logo = `
  ╔╦╗╦ ╦╦  ╔═╗╔═╗╔═╗╦  ╔═╗╦  ╦
  ║║║╚╦╝║  ║ ║║  ╠═╣║  ║  ║  ║
  ╩ ╩ ╩ ╩═╝╚═╝╚═╝╩ ╩╩═╝╚═╝╩═╝╩
  `;

    console.log(colors.primary(logo));
    console.log(colors.muted('  Your Own AI Coding Assistant\n'));
}

export function printWelcome(provider, model) {
    const content = `${figures.pointer} Provider: ${colors.secondary(provider)}
${figures.pointer} Model: ${colors.code(model)}
${figures.pointer} Type ${colors.primary('/help')} for commands`;

    console.log(boxen(content, {
        padding: 1,
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: '#7C3AED'
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
    console.log(`\n${colors.primary('Available Providers:')}\n`);
    for (const [key, provider] of Object.entries(providers)) {
        const isCurrent = key === current;
        const marker = isCurrent ? colors.success(figures.tick) : ' ';
        const name = isCurrent ? colors.primary(provider.name) : provider.name;
        console.log(`  ${marker} ${provider.icon} ${name} - ${colors.muted(provider.description)}`);
    }
    console.log();
}

export function printModelsList(models) {
    console.log(`\n${colors.primary('Available Models:')}\n`);
    for (const model of models) {
        console.log(`  ${figures.pointer} ${colors.code(model.id)} ${colors.muted(`(${model.owned_by})`)}`);
    }
    console.log();
}

export default {
    colors,
    printLogo,
    printWelcome,
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
