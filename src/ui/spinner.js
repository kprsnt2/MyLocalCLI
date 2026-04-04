import ora from 'ora';
import chalk from 'chalk';

const spinnerFrames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

export function createSpinner(text = 'Loading...') {
    return ora({
        text: chalk.hex('#7C3AED')(text),
        color: 'magenta',
        spinner: {
            interval: 70,
            frames: spinnerFrames
        }
    });
}

export function withSpinner(text, asyncFn) {
    const spinner = createSpinner(text);
    spinner.start();

    return asyncFn()
        .then(result => {
            spinner.succeed(chalk.hex('#10B981')(text));
            return result;
        })
        .catch(error => {
            spinner.fail(chalk.hex('#EF4444')(text));
            throw error;
        });
}

export function thinkingSpinner() {
    return ora({
        text: chalk.hex('#7C3AED')('Thinking...'),
        color: 'magenta',
        spinner: {
            interval: 200,
            frames: [
                chalk.hex('#7C3AED')('🤔 Thinking'),
                chalk.hex('#8B5CF6')('🤔 Thinking.'),
                chalk.hex('#A78BFA')('💭 Reasoning..'),
                chalk.hex('#C4B5FD')('🧠 Processing...'),
                chalk.hex('#A78BFA')('✨ Generating..'),
                chalk.hex('#8B5CF6')('💡 Composing.'),
            ]
        }
    });
}

export function connectingSpinner() {
    return ora({
        text: chalk.hex('#06B6D4')('Connecting to AI...'),
        color: 'cyan',
        spinner: {
            interval: 100,
            frames: [
                chalk.hex('#06B6D4')('◜ '),
                chalk.hex('#22D3EE')('◠ '),
                chalk.hex('#67E8F9')('◝ '),
                chalk.hex('#A5F3FC')('◞ '),
                chalk.hex('#67E8F9')('◡ '),
                chalk.hex('#22D3EE')('◟ '),
            ]
        }
    });
}

export function toolSpinnerOra(toolName) {
    const icons = {
        read_file: '📖', write_file: '📝', edit_file: '✏️',
        run_command: '⚡', git_status: '📊', test_run: '🧪',
        search_files: '🔍', grep: '🔎', web_fetch: '🌐'
    };
    const icon = icons[toolName] || '🔧';
    return ora({
        text: chalk.hex('#06B6D4')(`${icon} ${toolName}`),
        color: 'cyan',
        spinner: {
            interval: 80,
            frames: spinnerFrames
        }
    });
}

export default {
    createSpinner,
    withSpinner,
    thinkingSpinner,
    connectingSpinner,
    toolSpinnerOra
};
