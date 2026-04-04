// Setup/System Init Report - Workspace environment analysis
// Ported from claw-code's setup.py and system_init.py

import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

export class WorkspaceSetup {
    constructor({ nodeVersion, platform, arch, cwd, projectType, testCommand }) {
        this.nodeVersion = nodeVersion;
        this.platform = platform;
        this.arch = arch;
        this.cwd = cwd;
        this.projectType = projectType;
        this.testCommand = testCommand;
    }

    startupSteps() {
        return [
            'prefetch workspace metadata',
            'detect project type and config',
            'load provider configuration',
            'initialize tool registry',
            'load skills and plugins',
            'apply permission context',
            'initialize session store'
        ];
    }
}

export class SetupReport {
    constructor({ setup, prefetches = [], trusted = true, cwd }) {
        this.setup = setup;
        this.prefetches = prefetches;
        this.trusted = trusted;
        this.cwd = cwd;
    }

    formatMarkdown() {
        const lines = [
            '# Setup Report',
            '',
            `- Node.js: ${this.setup.nodeVersion}`,
            `- Platform: ${this.setup.platform} (${this.setup.arch})`,
            `- CWD: ${this.cwd}`,
            `- Project type: ${this.setup.projectType}`,
            `- Trusted mode: ${this.trusted}`,
            '',
            '## Prefetches',
            ...this.prefetches.map(p => `- ${p.name}: ${p.detail}`),
            '',
            '## Startup Steps',
            ...this.setup.startupSteps().map(s => `- ${s}`)
        ];
        return lines.join('\n');
    }
}

async function detectProjectType(cwd) {
    const detectors = [
        { file: 'package.json', type: 'nodejs' },
        { file: 'requirements.txt', type: 'python' },
        { file: 'pyproject.toml', type: 'python' },
        { file: 'Cargo.toml', type: 'rust' },
        { file: 'go.mod', type: 'go' },
        { file: 'pom.xml', type: 'java' },
        { file: 'Gemfile', type: 'ruby' },
        { file: 'composer.json', type: 'php' }
    ];

    for (const d of detectors) {
        try {
            await fs.access(path.join(cwd, d.file));
            return d.type;
        } catch {
            // not found
        }
    }
    return 'unknown';
}

function detectTestCommand(projectType) {
    const commands = {
        nodejs: 'npm test',
        python: 'python -m pytest',
        rust: 'cargo test',
        go: 'go test ./...',
        java: 'mvn test',
        ruby: 'bundle exec rspec',
        php: 'vendor/bin/phpunit'
    };
    return commands[projectType] || 'echo "no test command"';
}

function runPrefetches(cwd) {
    const results = [];

    // Git info prefetch
    try {
        execSync('git rev-parse --git-dir', { cwd, stdio: 'pipe' });
        results.push({ name: 'git_info', started: true, detail: 'Git repository detected' });
    } catch {
        results.push({ name: 'git_info', started: false, detail: 'Not a git repository' });
    }

    // Node modules check
    try {
        const nmPath = path.join(cwd, 'node_modules');
        results.push({ name: 'node_modules', started: true, detail: `Checking ${nmPath}` });
    } catch {
        results.push({ name: 'node_modules', started: false, detail: 'No node_modules' });
    }

    return results;
}

export async function runSetup(cwd = process.cwd(), trusted = true) {
    const projectType = await detectProjectType(cwd);
    const testCommand = detectTestCommand(projectType);
    const prefetches = runPrefetches(cwd);

    const setup = new WorkspaceSetup({
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        cwd,
        projectType,
        testCommand
    });

    return new SetupReport({
        setup,
        prefetches,
        trusted,
        cwd
    });
}

export function buildSystemInitMessage(trusted = true) {
    const lines = [
        '# System Init',
        '',
        `Trusted: ${trusted}`,
        `Node.js: ${process.version}`,
        `Platform: ${os.platform()} ${os.arch()}`,
        '',
        'Startup steps:',
        '- prefetch workspace metadata',
        '- detect project type and config',
        '- load provider configuration',
        '- initialize tool registry',
        '- load skills and plugins',
        '- apply permission context',
        '- initialize session store'
    ];
    return lines.join('\n');
}

export default { WorkspaceSetup, SetupReport, runSetup, buildSystemInitMessage };
