import { spawn } from 'child_process';
import inquirer from 'inquirer';
import { printCommand, printWarning, printError, printSuccess, colors } from '../ui/terminal.js';

// Safe command executor
const DANGEROUS_COMMANDS = [
    'rm -rf',
    'rm -r',
    'rmdir',
    'del /s',
    'rd /s',
    'format',
    'mkfs',
    'dd if=',
    ':(){:|:&};:',
    'chmod -R 777',
    'chmod 777',
    '> /dev/sda',
    'mv /* ',
    'wget',
    'curl',
    'sudo',
    'su ',
    'shutdown',
    'reboot',
    'kill -9',
    'killall'
];

const SAFE_COMMANDS = [
    'ls', 'dir', 'pwd', 'cd', 'echo', 'cat', 'type', 'head', 'tail',
    'grep', 'find', 'which', 'where', 'whoami', 'date', 'env',
    'node --version', 'npm --version', 'python --version', 'git status',
    'git log', 'git branch', 'git diff', 'npm list', 'pip list'
];

export function isDangerousCommand(command) {
    const lowerCmd = command.toLowerCase();
    return DANGEROUS_COMMANDS.some(dangerous => lowerCmd.includes(dangerous));
}

export function isSafeCommand(command) {
    const lowerCmd = command.toLowerCase().trim();
    return SAFE_COMMANDS.some(safe => lowerCmd.startsWith(safe));
}

export async function executeCommand(command, options = {}) {
    const {
        cwd = process.cwd(),
        requireConfirmation = true,
        timeout = 30000
    } = options;

    // Check for dangerous commands
    if (isDangerousCommand(command)) {
        printWarning('This command appears to be potentially dangerous.');
        const { proceed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: 'Are you absolutely sure you want to run this command?',
            default: false
        }]);

        if (!proceed) {
            return { success: false, error: 'Command cancelled by user' };
        }
    }

    // Confirm before running
    if (requireConfirmation && !isSafeCommand(command)) {
        printCommand(command);
        const { proceed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: 'Run this command?',
            default: true
        }]);

        if (!proceed) {
            return { success: false, error: 'Command cancelled by user' };
        }
    }

    return new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd' : '/bin/sh';
        const shellFlag = isWindows ? '/c' : '-c';

        const proc = spawn(shell, [shellFlag, command], {
            cwd,
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        let killed = false;

        const timer = setTimeout(() => {
            killed = true;
            proc.kill('SIGTERM');
        }, timeout);

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(colors.muted(data.toString()));
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(colors.error(data.toString()));
        });

        proc.on('close', (code) => {
            clearTimeout(timer);

            if (killed) {
                resolve({
                    success: false,
                    error: 'Command timed out',
                    stdout,
                    stderr
                });
            } else if (code === 0) {
                printSuccess('Command completed successfully');
                resolve({
                    success: true,
                    stdout,
                    stderr,
                    exitCode: code
                });
            } else {
                printError(`Command failed with exit code ${code}`);
                resolve({
                    success: false,
                    error: `Exit code: ${code}`,
                    stdout,
                    stderr,
                    exitCode: code
                });
            }
        });

        proc.on('error', (error) => {
            clearTimeout(timer);
            resolve({
                success: false,
                error: error.message,
                stdout,
                stderr
            });
        });
    });
}

export default {
    isDangerousCommand,
    isSafeCommand,
    executeCommand
};
