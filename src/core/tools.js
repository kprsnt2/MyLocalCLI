import { readFile, writeFile, listDirectory, searchFiles, getFileStats } from '../utils/files.js';
import { executeCommand } from './executor.js';
import { getGitInfo, getGitDiff } from '../utils/git.js';
import { printInfo, printWarning, printSuccess, printCode, colors } from '../ui/terminal.js';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

// Enhanced tool definitions for AI agents - Claude Code style
export const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'read_file',
            description: 'Read the contents of a file at the given path.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to the file' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'write_file',
            description: 'Write content to a file, creating it if needed.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to write to' },
                    content: { type: 'string', description: 'Content to write' }
                },
                required: ['path', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'edit_file',
            description: 'Edit a file by replacing old content with new content.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to the file' },
                    old_content: { type: 'string', description: 'Content to find' },
                    new_content: { type: 'string', description: 'Content to replace with' }
                },
                required: ['path', 'old_content', 'new_content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_directory',
            description: 'List files and folders in a directory.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Directory path' },
                    recursive: { type: 'boolean', description: 'List recursively' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_files',
            description: 'Search for files matching a glob pattern.',
            parameters: {
                type: 'object',
                properties: {
                    pattern: { type: 'string', description: 'Glob pattern (e.g., "*.js")' }
                },
                required: ['pattern']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'run_command',
            description: 'Execute a shell command.',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'Command to run' }
                },
                required: ['command']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'git_status',
            description: 'Get git repository status.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'git_diff',
            description: 'Get git diff of changes.',
            parameters: {
                type: 'object',
                properties: {
                    staged: { type: 'boolean', description: 'Show staged changes only' }
                },
                required: []
            }
        }
    },
    // NEW TOOLS - Claude Code style
    {
        type: 'function',
        function: {
            name: 'grep',
            description: 'Search for text in files using regex or string pattern.',
            parameters: {
                type: 'object',
                properties: {
                    pattern: { type: 'string', description: 'Search pattern (text or regex)' },
                    path: { type: 'string', description: 'File or directory to search in' },
                    include: { type: 'string', description: 'File pattern to include (e.g., "*.js")' }
                },
                required: ['pattern']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'tree',
            description: 'Show directory structure as a tree.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Directory path (default: current)' },
                    depth: { type: 'number', description: 'Max depth to show (default: 3)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'find_replace',
            description: 'Find and replace text across multiple files.',
            parameters: {
                type: 'object',
                properties: {
                    find: { type: 'string', description: 'Text to find' },
                    replace: { type: 'string', description: 'Text to replace with' },
                    path: { type: 'string', description: 'Directory or file path' },
                    include: { type: 'string', description: 'File pattern (e.g., "*.js")' }
                },
                required: ['find', 'replace']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_directory',
            description: 'Create a new directory.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Directory path to create' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_file',
            description: 'Delete a file or directory.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to delete' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'move_file',
            description: 'Move or rename a file or directory.',
            parameters: {
                type: 'object',
                properties: {
                    source: { type: 'string', description: 'Source path' },
                    destination: { type: 'string', description: 'Destination path' }
                },
                required: ['source', 'destination']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'copy_file',
            description: 'Copy a file to a new location.',
            parameters: {
                type: 'object',
                properties: {
                    source: { type: 'string', description: 'Source path' },
                    destination: { type: 'string', description: 'Destination path' }
                },
                required: ['source', 'destination']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'file_info',
            description: 'Get information about a file (size, type, modified date).',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'append_file',
            description: 'Append content to the end of a file.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    content: { type: 'string', description: 'Content to append' }
                },
                required: ['path', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'insert_at_line',
            description: 'Insert content at a specific line number.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    line: { type: 'number', description: 'Line number to insert at' },
                    content: { type: 'string', description: 'Content to insert' }
                },
                required: ['path', 'line', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'read_lines',
            description: 'Read specific lines from a file.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    start: { type: 'number', description: 'Start line (1-indexed)' },
                    end: { type: 'number', description: 'End line (inclusive)' }
                },
                required: ['path', 'start', 'end']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'git_log',
            description: 'Show git commit history.',
            parameters: {
                type: 'object',
                properties: {
                    count: { type: 'number', description: 'Number of commits to show (default: 10)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'git_commit',
            description: 'Create a git commit with a message.',
            parameters: {
                type: 'object',
                properties: {
                    message: { type: 'string', description: 'Commit message' }
                },
                required: ['message']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'web_fetch',
            description: 'Fetch content from a URL.',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL to fetch' }
                },
                required: ['url']
            }
        }
    }
];

// Execute a tool by name
export async function executeTool(toolName, args, cwd, options = {}) {
    const { autoApprove = false, showDiff = true } = options;
    const resolvePath = (p) => path.isAbsolute(p) ? p : path.join(cwd, p);

    switch (toolName) {
        case 'read_file': {
            const filePath = resolvePath(args.path);
            const result = await readFile(filePath);
            if (result.success) {
                printInfo(`📄 Read: ${args.path}`);
                return { success: true, content: result.content };
            }
            return result;
        }

        case 'write_file': {
            const filePath = resolvePath(args.path);
            const existing = await readFile(filePath);

            if (showDiff && existing.success) {
                console.log('\n' + colors.warning('📝 Modify:') + ` ${args.path}`);
                printCode(generateDiff(existing.content, args.content), 'diff');
            } else if (showDiff) {
                console.log('\n' + colors.success('📄 Create:') + ` ${args.path}`);
                printCode(args.content.slice(0, 500) + (args.content.length > 500 ? '\n...' : ''), 'text');
            }

            if (!autoApprove) {
                const { proceed } = await inquirer.prompt([{
                    type: 'confirm', name: 'proceed', message: 'Apply?', default: true
                }]);
                if (!proceed) return { success: false, error: 'Cancelled' };
            }

            await fs.mkdir(path.dirname(filePath), { recursive: true });
            const result = await writeFile(filePath, args.content);
            if (result.success) printSuccess(`✅ Written: ${args.path}`);
            return result;
        }

        case 'edit_file': {
            const filePath = resolvePath(args.path);
            const existing = await readFile(filePath);
            if (!existing.success) return { success: false, error: `File not found: ${args.path}` };
            if (!existing.content.includes(args.old_content)) {
                return { success: false, error: 'Content not found in file' };
            }

            const newContent = existing.content.replace(args.old_content, args.new_content);
            if (showDiff) {
                console.log('\n' + colors.warning('📝 Edit:') + ` ${args.path}`);
                printCode(generateDiff(args.old_content, args.new_content), 'diff');
            }

            if (!autoApprove) {
                const { proceed } = await inquirer.prompt([{
                    type: 'confirm', name: 'proceed', message: 'Apply?', default: true
                }]);
                if (!proceed) return { success: false, error: 'Cancelled' };
            }

            const result = await writeFile(filePath, newContent);
            if (result.success) printSuccess(`✅ Edited: ${args.path}`);
            return result;
        }

        case 'list_directory': {
            const dirPath = resolvePath(args.path || '.');
            const items = await listDirectory(dirPath, { recursive: args.recursive });
            printInfo(`📁 Listed: ${args.path || '.'} (${items.length} items)`);
            return { success: true, items };
        }

        case 'search_files': {
            const files = await searchFiles(args.pattern, cwd);
            printInfo(`🔍 Found ${files.length} files`);
            return { success: true, files: files.map(f => path.relative(cwd, f)) };
        }

        case 'run_command': {
            printInfo(`🖥️ Running: ${args.command}`);
            return await executeCommand(args.command, { cwd, requireConfirmation: !autoApprove });
        }

        case 'git_status': {
            const info = await getGitInfo(cwd);
            if (info) printInfo(`📊 Git: ${info.branch} (${info.changedFiles} changes)`);
            return { success: true, ...info };
        }

        case 'git_diff': {
            const diff = await getGitDiff(cwd, args.staged);
            return { success: true, diff };
        }

        // NEW TOOLS
        case 'grep': {
            try {
                const searchPath = resolvePath(args.path || '.');
                const include = args.include ? `--include="${args.include}"` : '';
                const cmd = `grep -rn ${include} "${args.pattern}" "${searchPath}" 2>/dev/null || true`;
                const output = execSync(cmd, { cwd, encoding: 'utf-8', maxBuffer: 1024 * 1024 });
                const lines = output.trim().split('\n').filter(l => l).slice(0, 50);
                printInfo(`🔍 Grep: ${lines.length} matches`);
                return { success: true, matches: lines, content: lines.join('\n') };
            } catch (e) {
                // Fallback: simple file search
                const files = await searchFiles(args.include || '**/*', resolvePath(args.path || '.'));
                const matches = [];
                for (const file of files.slice(0, 20)) {
                    const content = await readFile(file);
                    if (content.success && content.content.includes(args.pattern)) {
                        const lines = content.content.split('\n');
                        lines.forEach((line, i) => {
                            if (line.includes(args.pattern)) {
                                matches.push(`${path.relative(cwd, file)}:${i + 1}: ${line.trim()}`);
                            }
                        });
                    }
                }
                printInfo(`🔍 Found ${matches.length} matches`);
                return { success: true, matches: matches.slice(0, 50), content: matches.slice(0, 50).join('\n') };
            }
        }

        case 'tree': {
            const dirPath = resolvePath(args.path || '.');
            const maxDepth = args.depth || 3;
            const tree = await buildTree(dirPath, maxDepth, 0, cwd);
            printInfo(`🌳 Tree: ${args.path || '.'}`);
            return { success: true, content: tree };
        }

        case 'find_replace': {
            const searchPath = resolvePath(args.path || '.');
            const pattern = args.include || '**/*';
            const files = await searchFiles(pattern, searchPath);
            let count = 0;

            console.log('\n' + colors.warning(`Find: "${args.find}" → Replace: "${args.replace}"`));

            if (!autoApprove) {
                const { proceed } = await inquirer.prompt([{
                    type: 'confirm', name: 'proceed',
                    message: `Replace in ${files.length} files?`, default: false
                }]);
                if (!proceed) return { success: false, error: 'Cancelled' };
            }

            for (const file of files) {
                const content = await readFile(file);
                if (content.success && content.content.includes(args.find)) {
                    const newContent = content.content.replaceAll(args.find, args.replace);
                    await writeFile(file, newContent);
                    count++;
                }
            }
            printSuccess(`✅ Replaced in ${count} files`);
            return { success: true, filesModified: count };
        }

        case 'create_directory': {
            const dirPath = resolvePath(args.path);
            await fs.mkdir(dirPath, { recursive: true });
            printSuccess(`📁 Created: ${args.path}`);
            return { success: true };
        }

        case 'delete_file': {
            const filePath = resolvePath(args.path);
            console.log('\n' + colors.error(`🗑️ Delete: ${args.path}`));

            if (!autoApprove) {
                const { proceed } = await inquirer.prompt([{
                    type: 'confirm', name: 'proceed', message: 'Delete?', default: false
                }]);
                if (!proceed) return { success: false, error: 'Cancelled' };
            }

            await fs.rm(filePath, { recursive: true });
            printSuccess(`🗑️ Deleted: ${args.path}`);
            return { success: true };
        }

        case 'move_file': {
            const source = resolvePath(args.source);
            const dest = resolvePath(args.destination);
            await fs.rename(source, dest);
            printSuccess(`📦 Moved: ${args.source} → ${args.destination}`);
            return { success: true };
        }

        case 'copy_file': {
            const source = resolvePath(args.source);
            const dest = resolvePath(args.destination);
            await fs.copyFile(source, dest);
            printSuccess(`📋 Copied: ${args.source} → ${args.destination}`);
            return { success: true };
        }

        case 'file_info': {
            const filePath = resolvePath(args.path);
            const stats = await fs.stat(filePath);
            const info = {
                path: args.path,
                size: stats.size,
                sizeHuman: formatBytes(stats.size),
                isDirectory: stats.isDirectory(),
                created: stats.birthtime,
                modified: stats.mtime
            };
            printInfo(`ℹ️ ${args.path}: ${info.sizeHuman}, modified ${info.modified.toLocaleDateString()}`);
            return { success: true, ...info };
        }

        case 'append_file': {
            const filePath = resolvePath(args.path);
            await fs.appendFile(filePath, args.content);
            printSuccess(`📝 Appended to: ${args.path}`);
            return { success: true };
        }

        case 'insert_at_line': {
            const filePath = resolvePath(args.path);
            const content = await readFile(filePath);
            if (!content.success) return content;

            const lines = content.content.split('\n');
            lines.splice(args.line - 1, 0, args.content);

            if (!autoApprove) {
                const { proceed } = await inquirer.prompt([{
                    type: 'confirm', name: 'proceed',
                    message: `Insert at line ${args.line}?`, default: true
                }]);
                if (!proceed) return { success: false, error: 'Cancelled' };
            }

            await writeFile(filePath, lines.join('\n'));
            printSuccess(`📝 Inserted at line ${args.line}: ${args.path}`);
            return { success: true };
        }

        case 'read_lines': {
            const filePath = resolvePath(args.path);
            const content = await readFile(filePath);
            if (!content.success) return content;

            const lines = content.content.split('\n');
            const selected = lines.slice(args.start - 1, args.end);
            printInfo(`📄 Lines ${args.start}-${args.end} of ${args.path}`);
            return { success: true, content: selected.join('\n'), lines: selected };
        }

        case 'git_log': {
            try {
                const count = args.count || 10;
                const output = execSync(`git log --oneline -n ${count}`, { cwd, encoding: 'utf-8' });
                printInfo(`📜 Git log (${count} commits)`);
                return { success: true, content: output.trim() };
            } catch (e) {
                return { success: false, error: 'Not a git repository' };
            }
        }

        case 'git_commit': {
            console.log('\n' + colors.warning(`📝 Commit: "${args.message}"`));

            if (!autoApprove) {
                const { proceed } = await inquirer.prompt([{
                    type: 'confirm', name: 'proceed', message: 'Commit?', default: true
                }]);
                if (!proceed) return { success: false, error: 'Cancelled' };
            }

            try {
                execSync(`git add -A && git commit -m "${args.message}"`, { cwd });
                printSuccess(`✅ Committed: ${args.message}`);
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        case 'web_fetch': {
            try {
                const response = await fetch(args.url);
                const text = await response.text();
                printInfo(`🌐 Fetched: ${args.url} (${formatBytes(text.length)})`);
                return { success: true, content: text.slice(0, 10000), status: response.status };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        default:
            return { success: false, error: `Unknown tool: ${toolName}` };
    }
}

// Helper: Build tree structure
async function buildTree(dir, maxDepth, currentDepth, cwd, prefix = '') {
    if (currentDepth >= maxDepth) return prefix + '...\n';

    let result = '';
    try {
        const items = await fs.readdir(dir);
        const filtered = items.filter(i => !i.startsWith('.') && i !== 'node_modules');

        for (let i = 0; i < filtered.length && i < 30; i++) {
            const item = filtered[i];
            const itemPath = path.join(dir, item);
            const isLast = i === filtered.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const stats = await fs.stat(itemPath);

            result += prefix + connector + item + (stats.isDirectory() ? '/' : '') + '\n';

            if (stats.isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                result += await buildTree(itemPath, maxDepth, currentDepth + 1, cwd, newPrefix);
            }
        }
    } catch (e) { }
    return result;
}

// Helper: Format bytes
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Generate simple diff
function generateDiff(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
        if (oldLines[i] === undefined) diff.push(`+ ${newLines[i]}`);
        else if (newLines[i] === undefined) diff.push(`- ${oldLines[i]}`);
        else if (oldLines[i] !== newLines[i]) {
            diff.push(`- ${oldLines[i]}`);
            diff.push(`+ ${newLines[i]}`);
        }
    }
    return diff.slice(0, 30).join('\n') + (diff.length > 30 ? '\n... (truncated)' : '');
}

// Parse tool calls from AI response
export function parseToolCalls(response) {
    const toolCalls = [];
    const jsonPattern = /```(?:json)?\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```/g;
    let match;

    while ((match = jsonPattern.exec(response)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.tool && parsed.arguments) {
                toolCalls.push({ name: parsed.tool, arguments: parsed.arguments });
            }
        } catch (e) { }
    }
    return toolCalls;
}

export default { TOOLS, executeTool, parseToolCalls };
