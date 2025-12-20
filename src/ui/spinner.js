import ora from 'ora';
import chalk from 'chalk';

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text = 'Loading...') {
    return ora({
        text,
        color: 'magenta',
        spinner: {
            interval: 80,
            frames: spinnerFrames
        }
    });
}

export function withSpinner(text, asyncFn) {
    const spinner = createSpinner(text);
    spinner.start();

    return asyncFn()
        .then(result => {
            spinner.succeed();
            return result;
        })
        .catch(error => {
            spinner.fail();
            throw error;
        });
}

export function thinkingSpinner() {
    return ora({
        text: chalk.hex('#7C3AED')('Thinking...'),
        color: 'magenta',
        spinner: {
            interval: 100,
            frames: ['🤔 ', '💭 ', '🧠 ', '✨ ']
        }
    });
}

export function connectingSpinner() {
    return ora({
        text: chalk.hex('#06B6D4')('Connecting to AI...'),
        color: 'cyan',
        spinner: 'dots'
    });
}

export default {
    createSpinner,
    withSpinner,
    thinkingSpinner,
    connectingSpinner
};
