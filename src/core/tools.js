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
    },
    // NEW CLAUDE CODE-STYLE TOOLS
    {
        type: 'function',
        function: {
            name: 'todo_write',
            description: 'Create or update a todo list to track tasks. Use this to maintain a persistent task list.',
            parameters: {
                type: 'object',
                properties: {
                    todos: {
                        type: 'array',
                        description: 'Array of todo items',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', description: 'Unique ID for the todo' },
                                content: { type: 'string', description: 'Todo description' },
                                status: { type: 'string', enum: ['pending', 'in_progress', 'done'], description: 'Todo status' },
                                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' }
                            },
                            required: ['id', 'content', 'status']
                        }
                    }
                },
                required: ['todos']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'multi_edit_file',
            description: 'Make multiple edits to a file in a single operation. More efficient than multiple edit_file calls.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to the file' },
                    edits: {
                        type: 'array',
                        description: 'Array of edit operations',
                        items: {
                            type: 'object',
                            properties: {
                                old_content: { type: 'string', description: 'Content to find' },
                                new_content: { type: 'string', description: 'Content to replace with' }
                            },
                            required: ['old_content', 'new_content']
                        }
                    }
                },
                required: ['path', 'edits']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'codebase_search',
            description: 'Search the codebase for code snippets matching a query. Uses fuzzy/semantic matching.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query (function names, concepts, etc.)' },
                    file_pattern: { type: 'string', description: 'File pattern to search (e.g., "*.js")' },
                    max_results: { type: 'number', description: 'Maximum results to return (default: 10)' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'ask_user',
            description: 'Ask the user a question and wait for their response. Use for clarification or decisions.',
            parameters: {
                type: 'object',
                properties: {
                    question: { type: 'string', description: 'Question to ask the user' },
                    options: {
                        type: 'array',
                        description: 'Optional list of choices for the user',
                        items: { type: 'string' }
                    }
                },
                required: ['question']
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
            const lineCount = args.content.split(/\r?\n/).length;

            // Show concise progress instead of code content
            if (existing.success) {
                console.log(colors.warning(`📝 Modifying: ${args.path} (${lineCount} lines)...`));
            } else {
                console.log(colors.success(`📄 Creating: ${args.path} (${lineCount} lines)...`));
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
            // Validate required arguments
            if (!args.path) {
                return { success: false, error: 'Missing required argument: path' };
            }
            if (args.old_content === undefined || args.old_content === null) {
                return { success: false, error: 'Missing required argument: old_content' };
            }
            if (args.new_content === undefined || args.new_content === null) {
                return { success: false, error: 'Missing required argument: new_content' };
            }

            const filePath = resolvePath(args.path);
            const existing = await readFile(filePath);
            if (!existing.success) return { success: false, error: `File not found: ${args.path}` };

            let content = existing.content;
            let oldContent = String(args.old_content);
            let newContentArg = String(args.new_content);

            // Detect and preserve original line endings
            const hasCRLF = content.includes('\r\n');
            const lineEnding = hasCRLF ? '\r\n' : '\n';

            // Normalize all content to LF for comparison
            const normalizedFileContent = content.replace(/\r\n/g, '\n');
            const normalizedOldContent = oldContent.replace(/\r\n/g, '\n');
            const normalizedNewContent = newContentArg.replace(/\r\n/g, '\n');

            // Try exact match with normalized line endings first
            if (normalizedFileContent.includes(normalizedOldContent)) {
                // Exact match found (after line ending normalization)
                let resultContent = normalizedFileContent.replace(normalizedOldContent, normalizedNewContent);

                // Restore original line endings if file had CRLF
                if (hasCRLF) {
                    resultContent = resultContent.replace(/\n/g, '\r\n');
                }

                // Show concise progress instead of diff
                const oldLineCount = normalizedOldContent.split('\n').length;
                const newLineCount = normalizedNewContent.split('\n').length;
                console.log(colors.warning(`📝 Editing: ${args.path} (${oldLineCount} → ${newLineCount} lines)...`));

                if (!autoApprove) {
                    const { proceed } = await inquirer.prompt([{
                        type: 'confirm', name: 'proceed', message: 'Apply?', default: true
                    }]);
                    if (!proceed) return { success: false, error: 'Cancelled' };
                }

                const result = await writeFile(filePath, resultContent);
                if (result.success) printSuccess(`✅ Edited: ${args.path}`);
                return result;
            }

            // Try with normalized whitespace (convert multiple spaces/tabs to single space)
            const wsNormalizedContent = normalizedFileContent.replace(/[ \t]+/g, ' ');
            const wsNormalizedOld = normalizedOldContent.replace(/[ \t]+/g, ' ');

            if (wsNormalizedContent.includes(wsNormalizedOld)) {
                // Find the original text that matches when normalized
                const lines = normalizedFileContent.split('\n');
                const oldLines = normalizedOldContent.split('\n');

                // Find starting line
                let startIdx = -1;
                for (let i = 0; i <= lines.length - oldLines.length; i++) {
                    let matches = true;
                    for (let j = 0; j < oldLines.length; j++) {
                        if (lines[i + j].replace(/[ \t]+/g, ' ').trim() !== oldLines[j].replace(/[ \t]+/g, ' ').trim()) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        startIdx = i;
                        break;
                    }
                }

                if (startIdx >= 0) {
                    // Replace the matching lines with new content
                    const before = lines.slice(0, startIdx).join('\n');
                    const after = lines.slice(startIdx + oldLines.length).join('\n');
                    let resultContent = before + (before ? '\n' : '') + normalizedNewContent + (after ? '\n' : '') + after;

                    // Restore original line endings if file had CRLF
                    if (hasCRLF) {
                        resultContent = resultContent.replace(/\n/g, '\r\n');
                    }

                    // Show concise progress instead of diff
                    const newLineCount = normalizedNewContent.split('\n').length;
                    console.log(colors.warning(`📝 Editing (fuzzy): ${args.path} at line ${startIdx + 1} (${oldLines.length} → ${newLineCount} lines)...`));

                    if (!autoApprove) {
                        const { proceed } = await inquirer.prompt([{
                            type: 'confirm', name: 'proceed', message: 'Apply?', default: true
                        }]);
                        if (!proceed) return { success: false, error: 'Cancelled' };
                    }

                    const result = await writeFile(filePath, resultContent);
                    if (result.success) printSuccess(`✅ Edited: ${args.path}`);
                    return result;
                }
            }

            // Still no match - show helpful error
            const searchLine = normalizedOldContent.split('\n')[0].trim().slice(0, 20);
            const lines = normalizedFileContent.split('\n');
            let hint = '';

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(searchLine.toLowerCase().slice(0, 10))) {
                    hint = `\nSimilar at line ${i + 1}: "${lines[i].trim().slice(0, 60)}"`;
                    break;
                }
            }

            return {
                success: false,
                error: `Content not found in file.${hint}\nTip: Use read_file first, then copy the EXACT text to edit.`
            };
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
                // Cross-platform grep implementation using JS
                const searchPath = resolvePath(args.path || '.');
                const pattern = args.include || '**/*';
                const files = await searchFiles(pattern, searchPath);
                const matches = [];

                for (const file of files.slice(0, 50)) {
                    try {
                        const content = await readFile(file);
                        if (content.success) {
                            const lines = content.content.split(/\r?\n/);
                            lines.forEach((line, i) => {
                                if (line.includes(args.pattern)) {
                                    matches.push(`${path.relative(cwd, file)}:${i + 1}: ${line.trim()}`);
                                }
                            });
                        }
                    } catch (e) {
                        // Skip files that can't be read
                    }
                }

                printInfo(`🔍 Grep: ${matches.length} matches`);
                return { success: true, matches: matches.slice(0, 50), content: matches.slice(0, 50).join('\n') };
            } catch (e) {
                return { success: false, error: e.message };
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
            try {
                const searchPath = resolvePath(args.path || '.');
                const pattern = args.include || '**/*';
                const files = await searchFiles(pattern, searchPath);
                let count = 0;

                // Normalize find/replace for line ending compatibility
                const normalizedFind = args.find.replace(/\r\n/g, '\n');
                const normalizedReplace = args.replace.replace(/\r\n/g, '\n');

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
                    if (content.success) {
                        const hasCRLF = content.content.includes('\r\n');
                        const normalizedContent = content.content.replace(/\r\n/g, '\n');

                        if (normalizedContent.includes(normalizedFind)) {
                            let newContent = normalizedContent.replaceAll(normalizedFind, normalizedReplace);
                            // Restore original line endings
                            if (hasCRLF) {
                                newContent = newContent.replace(/\n/g, '\r\n');
                            }
                            await writeFile(file, newContent);
                            count++;
                        }
                    }
                }
                printSuccess(`✅ Replaced in ${count} files`);
                return { success: true, filesModified: count };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        case 'create_directory': {
            const dirPath = resolvePath(args.path);
            await fs.mkdir(dirPath, { recursive: true });
            printSuccess(`📁 Created: ${args.path}`);
            return { success: true };
        }

        case 'delete_file': {
            try {
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
            } catch (e) {
                return { success: false, error: `Failed to delete: ${e.message}` };
            }
        }

        case 'move_file': {
            try {
                const source = resolvePath(args.source);
                const dest = resolvePath(args.destination);
                // Ensure destination directory exists
                await fs.mkdir(path.dirname(dest), { recursive: true });
                await fs.rename(source, dest);
                printSuccess(`📦 Moved: ${args.source} → ${args.destination}`);
                return { success: true };
            } catch (e) {
                return { success: false, error: `Failed to move: ${e.message}` };
            }
        }

        case 'copy_file': {
            try {
                const source = resolvePath(args.source);
                const dest = resolvePath(args.destination);
                // Ensure destination directory exists
                await fs.mkdir(path.dirname(dest), { recursive: true });
                await fs.copyFile(source, dest);
                printSuccess(`📋 Copied: ${args.source} → ${args.destination}`);
                return { success: true };
            } catch (e) {
                return { success: false, error: `Failed to copy: ${e.message}` };
            }
        }

        case 'file_info': {
            try {
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
            } catch (e) {
                return { success: false, error: `File not found: ${e.message}` };
            }
        }

        case 'append_file': {
            try {
                const filePath = resolvePath(args.path);
                // Create directory if it doesn't exist
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.appendFile(filePath, args.content);
                printSuccess(`📝 Appended to: ${args.path}`);
                return { success: true };
            } catch (e) {
                return { success: false, error: `Failed to append: ${e.message}` };
            }
        }

        case 'insert_at_line': {
            try {
                const filePath = resolvePath(args.path);
                const fileContent = await readFile(filePath);
                if (!fileContent.success) return fileContent;

                // Preserve line endings
                const hasCRLF = fileContent.content.includes('\r\n');
                const normalizedContent = fileContent.content.replace(/\r\n/g, '\n');
                const lines = normalizedContent.split('\n');

                // Normalize the content to insert
                const normalizedInsert = args.content.replace(/\r\n/g, '\n');
                lines.splice(args.line - 1, 0, normalizedInsert);

                if (!autoApprove) {
                    const { proceed } = await inquirer.prompt([{
                        type: 'confirm', name: 'proceed',
                        message: `Insert at line ${args.line}?`, default: true
                    }]);
                    if (!proceed) return { success: false, error: 'Cancelled' };
                }

                let resultContent = lines.join('\n');
                // Restore original line endings
                if (hasCRLF) {
                    resultContent = resultContent.replace(/\n/g, '\r\n');
                }

                await writeFile(filePath, resultContent);
                printSuccess(`📝 Inserted at line ${args.line}: ${args.path}`);
                return { success: true };
            } catch (e) {
                return { success: false, error: `Failed to insert: ${e.message}` };
            }
        }

        case 'read_lines': {
            try {
                const filePath = resolvePath(args.path);
                const fileContent = await readFile(filePath);
                if (!fileContent.success) return fileContent;

                // Handle both CRLF and LF line endings
                const lines = fileContent.content.split(/\r?\n/);
                const selected = lines.slice(args.start - 1, args.end);
                printInfo(`📄 Lines ${args.start}-${args.end} of ${args.path}`);
                return { success: true, content: selected.join('\n'), lines: selected };
            } catch (e) {
                return { success: false, error: e.message };
            }
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

        // NEW CLAUDE CODE-STYLE TOOL IMPLEMENTATIONS
        case 'todo_write': {
            try {
                const todoPath = path.join(cwd, '.mylocalcli', 'todos.json');
                await fs.mkdir(path.dirname(todoPath), { recursive: true });

                // Format todos for display
                const todoContent = {
                    updated: new Date().toISOString(),
                    todos: args.todos
                };

                await fs.writeFile(todoPath, JSON.stringify(todoContent, null, 2));

                // Print summary
                const pending = args.todos.filter(t => t.status === 'pending').length;
                const inProgress = args.todos.filter(t => t.status === 'in_progress').length;
                const done = args.todos.filter(t => t.status === 'done').length;

                printSuccess(`📋 Todos: ${pending} pending, ${inProgress} in progress, ${done} done`);

                // Also create a markdown version for easy reading
                const mdContent = `# Task List\n\n${args.todos.map(t => {
                    const checkbox = t.status === 'done' ? '[x]' : t.status === 'in_progress' ? '[/]' : '[ ]';
                    const priority = t.priority ? ` (${t.priority})` : '';
                    return `- ${checkbox} ${t.content}${priority}`;
                }).join('\n')}\n`;

                await fs.writeFile(path.join(cwd, '.mylocalcli', 'todos.md'), mdContent);

                return { success: true, todos: args.todos };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        case 'multi_edit_file': {
            try {
                const filePath = resolvePath(args.path);
                const existing = await readFile(filePath);
                if (!existing.success) {
                    return { success: false, error: `File not found: ${args.path}` };
                }

                let content = existing.content;
                const hasCRLF = content.includes('\r\n');

                // Normalize to LF for processing
                content = content.replace(/\r\n/g, '\n');

                let editCount = 0;
                for (const edit of args.edits) {
                    const normalizedOld = edit.old_content.replace(/\r\n/g, '\n');
                    const normalizedNew = edit.new_content.replace(/\r\n/g, '\n');

                    if (content.includes(normalizedOld)) {
                        content = content.replace(normalizedOld, normalizedNew);
                        editCount++;
                    }
                }

                if (editCount === 0) {
                    return { success: false, error: 'No matching content found for any edits' };
                }

                // Restore line endings
                if (hasCRLF) {
                    content = content.replace(/\n/g, '\r\n');
                }

                console.log(colors.warning(`📝 Multi-edit: ${args.path} (${editCount}/${args.edits.length} edits)...`));

                if (!autoApprove) {
                    const { proceed } = await inquirer.prompt([{
                        type: 'confirm', name: 'proceed', message: 'Apply all edits?', default: true
                    }]);
                    if (!proceed) return { success: false, error: 'Cancelled' };
                }

                const result = await writeFile(filePath, content);
                if (result.success) printSuccess(`✅ Applied ${editCount} edits to: ${args.path}`);
                return { success: true, editsApplied: editCount };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        case 'codebase_search': {
            try {
                const pattern = args.file_pattern || '**/*.{js,ts,py,java,go,rs,c,cpp,h,jsx,tsx,vue,svelte,md}';
                const maxResults = args.max_results || 10;
                const files = await searchFiles(pattern, cwd);
                const results = [];
                const queryLower = args.query.toLowerCase();
                const queryWords = queryLower.split(/\s+/);

                for (const file of files.slice(0, 100)) {
                    try {
                        const content = await readFile(file);
                        if (!content.success) continue;

                        const lines = content.content.split(/\r?\n/);
                        const relativePath = path.relative(cwd, file);

                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            const lineLower = line.toLowerCase();

                            // Check if line contains query or query words
                            const matchScore = queryWords.reduce((score, word) => {
                                return score + (lineLower.includes(word) ? 1 : 0);
                            }, 0);

                            if (matchScore > 0 || lineLower.includes(queryLower)) {
                                results.push({
                                    file: relativePath,
                                    line: i + 1,
                                    content: line.trim().slice(0, 200),
                                    score: matchScore
                                });
                            }
                        }
                    } catch (e) {
                        // Skip unreadable files
                    }
                }

                // Sort by score and limit results
                results.sort((a, b) => b.score - a.score);
                const topResults = results.slice(0, maxResults);

                printInfo(`🔍 Found ${results.length} matches, showing top ${topResults.length}`);

                const content = topResults.map(r =>
                    `${r.file}:${r.line}: ${r.content}`
                ).join('\n');

                return { success: true, results: topResults, content };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }

        case 'ask_user': {
            try {
                console.log('\n' + colors.primary('❓ ' + args.question) + '\n');

                let answer;
                if (args.options && args.options.length > 0) {
                    const { choice } = await inquirer.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select an option:',
                        choices: args.options
                    }]);
                    answer = choice;
                } else {
                    const { response } = await inquirer.prompt([{
                        type: 'input',
                        name: 'response',
                        message: 'Your answer:'
                    }]);
                    answer = response;
                }

                printInfo(`User answered: ${answer}`);
                return { success: true, answer };
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

// Parse tool calls from AI response - handles multiple formats
export function parseToolCalls(response) {
    const toolCalls = [];

    // Format 1: JSON in markdown code blocks
    // ```json
    // {"tool": "write_file", "arguments": {...}}
    // ```
    const codeBlockPattern = /```(?:json)?\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```/g;
    let match;
    while ((match = codeBlockPattern.exec(response)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.tool && parsed.arguments) {
                toolCalls.push({ name: parsed.tool, arguments: parsed.arguments });
            }
        } catch (e) { }
    }

    // Format 2: Channel/message format (some models use this)
    // <|message|>{"tool":"write_file","arguments":{...}}
    const channelPattern = /<\|message\|>\s*(\{[\s\S]*?"tool"[\s\S]*?\})/g;
    while ((match = channelPattern.exec(response)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.tool && parsed.arguments) {
                toolCalls.push({ name: parsed.tool, arguments: parsed.arguments });
            }
        } catch (e) { }
    }

    // Format 3: Raw JSON in response (no code blocks)
    // {"tool": "write_file", "arguments": {...}}
    if (toolCalls.length === 0) {
        const rawJsonPattern = /\{"tool"\s*:\s*"([^"]+)"[\s\S]*?"arguments"\s*:\s*(\{[\s\S]*?\})\s*\}/g;
        while ((match = rawJsonPattern.exec(response)) !== null) {
            try {
                const fullMatch = match[0];
                const parsed = JSON.parse(fullMatch);
                if (parsed.tool && parsed.arguments) {
                    toolCalls.push({ name: parsed.tool, arguments: parsed.arguments });
                }
            } catch (e) { }
        }
    }

    // Format 4: Function call format
    // <function_call>{"name": "write_file", "arguments": {...}}</function_call>
    const funcCallPattern = /<function_call>\s*(\{[\s\S]*?\})\s*<\/function_call>/g;
    while ((match = funcCallPattern.exec(response)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.name && parsed.arguments) {
                toolCalls.push({ name: parsed.name, arguments: parsed.arguments });
            }
        } catch (e) { }
    }

    // Format 5: GPT-OSS container.exec format
    // <|channel|>commentary to=container.exec <|constrain|>json<|message|>{"cmd":["bash","-lc","ls -R"]}
    const containerExecPattern = /to=container\.exec[^{]*\|message\|>\s*(\{[\s\S]*?\})/g;
    while ((match = containerExecPattern.exec(response)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.cmd && Array.isArray(parsed.cmd)) {
                // Convert container exec to run_command
                const command = parsed.cmd.slice(-1)[0]; // Get the actual command
                toolCalls.push({ name: 'run_command', arguments: { command } });
            }
        } catch (e) { }
    }

    // Format 6: GPT-OSS repo_browser format
    // <|channel|>commentary to=repo_browser.write_file <|constrain|>json<|message|>{"tool":"write_file","arguments":{...}}
    const repoBrowserPattern = /to=repo_browser\.(\w+)[^{]*\|message\|>\s*(\{[\s\S]*?\})/g;
    while ((match = repoBrowserPattern.exec(response)) !== null) {
        try {
            const toolName = match[1];
            const parsed = JSON.parse(match[2]);

            // If the JSON has tool/arguments format, use that
            if (parsed.tool && parsed.arguments) {
                toolCalls.push({ name: parsed.tool, arguments: parsed.arguments });
            }
            // Otherwise, use the tool name from the channel
            else if (toolName) {
                toolCalls.push({ name: toolName, arguments: parsed });
            }
        } catch (e) { }
    }

    return toolCalls;
}

export default { TOOLS, executeTool, parseToolCalls };
