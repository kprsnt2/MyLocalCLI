import { spawn } from 'child_process';
import path from 'path';
import { fileExists } from './files.js';

// Git utilities
export async function isGitRepo(dir) {
    const gitDir = path.join(dir, '.git');
    return await fileExists(gitDir);
}

export async function getGitInfo(dir) {
    if (!await isGitRepo(dir)) {
        return null;
    }

    try {
        const [branch, status, lastCommit] = await Promise.all([
            runGitCommand(dir, ['branch', '--show-current']),
            runGitCommand(dir, ['status', '--porcelain']),
            runGitCommand(dir, ['log', '-1', '--pretty=format:%h %s'])
        ]);

        return {
            branch: branch.trim(),
            hasChanges: status.trim().length > 0,
            lastCommit: lastCommit.trim(),
            changedFiles: status.trim().split('\n').filter(Boolean).length
        };
    } catch {
        return null;
    }
}

export async function getGitDiff(dir, staged = false) {
    if (!await isGitRepo(dir)) {
        return '';
    }

    try {
        const args = staged ? ['diff', '--staged'] : ['diff'];
        return await runGitCommand(dir, args);
    } catch {
        return '';
    }
}

export async function getGitLog(dir, count = 10) {
    if (!await isGitRepo(dir)) {
        return [];
    }

    try {
        const output = await runGitCommand(dir, [
            'log',
            `-${count}`,
            '--pretty=format:%h|%s|%an|%ar'
        ]);

        return output.trim().split('\n').filter(Boolean).map(line => {
            const [hash, message, author, time] = line.split('|');
            return { hash, message, author, time };
        });
    } catch {
        return [];
    }
}

function runGitCommand(dir, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn('git', args, { cwd: dir });
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => stderr += data);

        proc.on('close', code => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || `Git command failed with code ${code}`));
            }
        });

        proc.on('error', reject);
    });
}

export default {
    isGitRepo,
    getGitInfo,
    getGitDiff,
    getGitLog
};
