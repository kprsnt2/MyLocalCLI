import { spawn } from 'child_process';
import inquirer from 'inquirer';
import { printCommand, printWarning, printError, printSuccess, colors } from '../ui/terminal.js';

// Cross-platform command translation map (Unix -> Windows)
const UNIX_TO_WINDOWS_COMMANDS = {
    'ls': 'dir',
    'ls -la': 'dir',
    'ls -l': 'dir',
    'ls -a': 'dir /a',
    'ls -al': 'dir /a',
    'ls -lh': 'dir',
    'cat': 'type',
    'rm': 'del',
    'rm -f': 'del /f',
    'rm -r': 'rmdir /s /q',
    'rm -rf': 'rmdir /s /q',
    'cp': 'copy',
    'cp -r': 'xcopy /s /e',
    'mv': 'move',
    'mkdir -p': 'mkdir',
    'touch': 'type nul >',
    'pwd': 'cd',
    'clear': 'cls',
    'grep': 'findstr',
    'find': 'dir /s /b',
    'head': 'more',
    'tail': 'more',
    'chmod': 'echo Windows does not support chmod',
    'chown': 'echo Windows does not support chown',
    'which': 'where',
    'man': 'help',
    'uname': 'ver',
    'ps': 'tasklist',
    'kill': 'taskkill /PID',
    'df': 'wmic logicaldisk get size,freespace,caption',
    'du': 'dir /s',
    'ln': 'mklink',
    'tar': 'tar',  // Windows 10+ has tar
    'curl': 'curl', // Windows 10+ has curl
    'wget': 'curl -O'
};

// Windows to Unix command translation map
const WINDOWS_TO_UNIX_COMMANDS = {
    'dir': 'ls -la',
    'type': 'cat',
    'del': 'rm',
    'copy': 'cp',
    'move': 'mv',
    'cls': 'clear',
    'findstr': 'grep',
    'where': 'which',
    'ver': 'uname -a',
    'tasklist': 'ps aux',
    'taskkill': 'kill'
};

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

/**
 * Translate a command for cross-platform compatibility
 * @param {string} command - The command to translate
 * @param {boolean} toWindows - If true, translate Unix->Windows; if false, Windows->Unix
 * @returns {string|null} - Translated command or null if no translation needed/available
 */
function translateCommand(command, toWindows = true) {
    const translationMap = toWindows ? UNIX_TO_WINDOWS_COMMANDS : WINDOWS_TO_UNIX_COMMANDS;
    const trimmedCmd = command.trim();

    // Check for exact match first
    if (translationMap[trimmedCmd]) {
        return translationMap[trimmedCmd];
    }

    // Check for command with arguments (match the base command)
    const parts = trimmedCmd.split(/\s+/);
    const baseCmd = parts[0];
    const args = parts.slice(1).join(' ');

    // Try to find a matching base command with flags
    for (const [unixCmd, winCmd] of Object.entries(translationMap)) {
        const unixParts = unixCmd.split(/\s+/);
        const unixBase = unixParts[0];

        if (baseCmd === unixBase) {
            // Check if the flags match
            const cmdWithFlags = parts.slice(0, unixParts.length).join(' ');
            if (translationMap[cmdWithFlags]) {
                const remainingArgs = parts.slice(unixParts.length).join(' ');
                return translationMap[cmdWithFlags] + (remainingArgs ? ' ' + remainingArgs : '');
            }

            // Just translate the base command
            if (translationMap[unixBase]) {
                return translationMap[unixBase] + (args ? ' ' + args : '');
            }
        }
    }

    return null;
}

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
        timeout = 30000,
        _isRetry = false  // Internal flag to prevent infinite retry loops
    } = options;

    const isWindows = process.platform === 'win32';

    // Pre-translate command for the current platform if possible
    let finalCommand = command;
    if (!_isRetry) {
        const translated = translateCommand(command, isWindows);
        if (translated && translated !== command) {
            console.log(colors.info(`🔄 Translating: "${command}" → "${translated}" (${isWindows ? 'Windows' : 'Unix'})`));
            finalCommand = translated;
        }
    }

    // Check for dangerous commands
    if (isDangerousCommand(finalCommand)) {
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
    if (requireConfirmation && !isSafeCommand(finalCommand)) {
        printCommand(finalCommand);
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

    const result = await runCommand(finalCommand, cwd, timeout);

    // If command failed and we haven't retried yet, try translating and retry
    if (!result.success && !_isRetry) {
        const translatedCmd = translateCommand(command, isWindows);

        // Check if stderr indicates command not found (common on Windows for Unix commands)
        const isCommandNotFound = result.stderr?.includes('is not recognized') ||
            result.stderr?.includes('not found') ||
            result.stderr?.includes('command not found') ||
            result.error?.includes('ENOENT');

        if (isCommandNotFound && translatedCmd && translatedCmd !== finalCommand) {
            console.log(colors.warning(`⚠️ Command not found. Retrying with: "${translatedCmd}"`));
            return executeCommand(translatedCmd, { ...options, _isRetry: true });
        }
    }

    return result;
}

/**
 * Internal function to actually run the command
 */
function runCommand(command, cwd, timeout) {
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
