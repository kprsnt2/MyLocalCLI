import { readFile, writeFile, listDirectory, searchFiles, getFileStats } from '../utils/files.js';
import { executeCommand } from './executor.js';
import { getGitInfo, getGitDiff } from '../utils/git.js';
import { printInfo, printWarning, printSuccess, printCode, colors } from '../ui/terminal.js';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import { taskRegistry } from './taskRegistry.js';
import { teamRegistry, cronRegistry } from './teamCronRegistry.js';
import { mcpRegistry } from './mcpToolBridge.js';
import { lspClient } from './lspClient.js';
import { loadSkills, activeSkills } from './skillsPlugin.js';
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
    },
    // === ADVANCED TOOLS ===
    {
        type: 'function',
        function: {
            name: 'patch_file',
            description: 'Apply a unified diff patch to a file. Accepts standard diff format with + and - lines.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path to patch' },
                    patch: { type: 'string', description: 'Unified diff patch content (lines starting with + or -)' }
                },
                required: ['path', 'patch']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'compare_files',
            description: 'Compare two files and show differences.',
            parameters: {
                type: 'object',
                properties: {
                    file_a: { type: 'string', description: 'First file path' },
                    file_b: { type: 'string', description: 'Second file path' }
                },
                required: ['file_a', 'file_b']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'batch_rename',
            description: 'Rename multiple files matching a pattern using find/replace on filenames.',
            parameters: {
                type: 'object',
                properties: {
                    directory: { type: 'string', description: 'Directory to search in' },
                    find: { type: 'string', description: 'Pattern to find in filenames' },
                    replace: { type: 'string', description: 'Replacement string' },
                    dry_run: { type: 'boolean', description: 'Preview changes without applying' }
                },
                required: ['directory', 'find', 'replace']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'project_stats',
            description: 'Show project statistics: lines of code, file counts by language, directory sizes.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Project directory (default: current)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'test_run',
            description: 'Detect and run the project test suite automatically (npm test, pytest, cargo test, etc.).',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'Override test command (auto-detected if empty)' },
                    filter: { type: 'string', description: 'Filter/pattern for specific tests' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'lint_check',
            description: 'Run project linter automatically (eslint, pylint, clippy, etc.).',
            parameters: {
                type: 'object',
                properties: {
                    fix: { type: 'boolean', description: 'Auto-fix issues if supported' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'dependency_check',
            description: 'Check project dependencies for issues, outdated packages, or vulnerabilities.',
            parameters: {
                type: 'object',
                properties: {
                    audit: { type: 'boolean', description: 'Run security audit' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'http_request',
            description: 'Make an HTTP request (GET, POST, PUT, DELETE) and return the response.',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'Request URL' },
                    method: { type: 'string', description: 'HTTP method (GET, POST, PUT, DELETE)', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
                    headers: { type: 'object', description: 'Request headers' },
                    body: { type: 'string', description: 'Request body (for POST/PUT)' }
                },
                required: ['url']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'json_query',
            description: 'Read a JSON file and extract data using a dot-notation path (e.g., "dependencies.react").',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to JSON file' },
                    query: { type: 'string', description: 'Dot-notation query path (e.g., "scripts.test", "dependencies")' }
                },
                required: ['path', 'query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'regex_test',
            description: 'Test a regex pattern against input text and return all matches with groups.',
            parameters: {
                type: 'object',
                properties: {
                    pattern: { type: 'string', description: 'Regex pattern' },
                    text: { type: 'string', description: 'Text to test against' },
                    flags: { type: 'string', description: 'Regex flags (g, i, m, etc.)' }
                },
                required: ['pattern', 'text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'hash_file',
            description: 'Compute hash of a file (MD5, SHA-256).',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    algorithm: { type: 'string', description: 'Hash algorithm (md5, sha256)', enum: ['md5', 'sha256'] }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'port_check',
            description: 'Check if a network port is in use and what process is using it.',
            parameters: {
                type: 'object',
                properties: {
                    port: { type: 'number', description: 'Port number to check' }
                },
                required: ['port']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory_store',
            description: 'Store or retrieve key-value data that persists across the session. Use for remembering context.',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', description: 'Action: set, get, list, delete', enum: ['set', 'get', 'list', 'delete'] },
                    key: { type: 'string', description: 'Key name' },
                    value: { type: 'string', description: 'Value to store (for set action)' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'notebook',
            description: 'Create or append to a Markdown notebook for documenting progress, decisions, and findings.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Notebook name (creates .mylocalcli/notebooks/<name>.md)' },
                    content: { type: 'string', description: 'Markdown content to add' },
                    action: { type: 'string', description: 'Action: create, append, read', enum: ['create', 'append', 'read'] }
                },
                required: ['name', 'action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'git_branch',
            description: 'Create, list, or switch git branches.',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', description: 'Action: create, list, switch, delete', enum: ['create', 'list', 'switch', 'delete'] },
                    name: { type: 'string', description: 'Branch name (for create/switch/delete)' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'git_stash',
            description: 'Git stash operations: save, pop, list, or drop stashed changes.',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', description: 'Action: save, pop, list, drop', enum: ['save', 'pop', 'list', 'drop'] },
                    message: { type: 'string', description: 'Stash message (for save)' }
                },
                required: ['action']
            }
        }
    },
    // Registry Tools
    {
        type: 'function',
        function: {
            name: 'TaskCreate',
            description: 'Create a background task.',
            parameters: { type: 'object', properties: { instruction: { type: 'string' } }, required: ['instruction'] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'TaskList',
            description: 'List all tasks.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'ListMcpResources',
            description: 'List active MCP server resources.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'LspGetSymbols',
            description: 'Get LSP symbols.',
            parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
        }
    }
];

// In-memory key-value store for memory_store tool
const memoryStore = new Map();

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

        // === ADVANCED TOOL IMPLEMENTATIONS ===

        case 'patch_file': {
            try {
                const filePath = resolvePath(args.path);
                const existing = await readFile(filePath);
                if (!existing.success) return { success: false, error: `File not found: ${args.path}` };

                const lines = existing.content.split(/\r?\n/);
                const hasCRLF = existing.content.includes('\r\n');
                const patchLines = args.patch.split(/\r?\n/);

                let result = [...lines];
                let offset = 0;
                for (const pl of patchLines) {
                    if (pl.startsWith('- ')) {
                        const text = pl.slice(2);
                        const idx = result.findIndex(l => l.trim() === text.trim());
                        if (idx >= 0) { result.splice(idx, 1); offset--; }
                    } else if (pl.startsWith('+ ')) {
                        result.push(pl.slice(2));
                    }
                }

                let content = result.join('\n');
                if (hasCRLF) content = content.replace(/\n/g, '\r\n');
                await writeFile(filePath, content);
                printSuccess(`Patched: ${args.path}`);
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'compare_files': {
            try {
                const a = await readFile(resolvePath(args.file_a));
                const b = await readFile(resolvePath(args.file_b));
                if (!a.success) return { success: false, error: `Cannot read: ${args.file_a}` };
                if (!b.success) return { success: false, error: `Cannot read: ${args.file_b}` };

                const linesA = a.content.split(/\r?\n/);
                const linesB = b.content.split(/\r?\n/);
                const diff = [];
                const max = Math.max(linesA.length, linesB.length);
                for (let i = 0; i < max; i++) {
                    if (linesA[i] !== linesB[i]) {
                        diff.push(`Line ${i + 1}:`);
                        if (linesA[i] !== undefined) diff.push(`  - ${linesA[i]}`);
                        if (linesB[i] !== undefined) diff.push(`  + ${linesB[i]}`);
                    }
                }
                printInfo(`Compared: ${diff.length ? diff.length / 2 + ' differences' : 'identical'}`);
                return { success: true, content: diff.join('\n') || 'Files are identical', identical: diff.length === 0 };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'batch_rename': {
            try {
                const dir = resolvePath(args.directory || '.');
                const items = await fs.readdir(dir);
                const renames = [];
                for (const item of items) {
                    if (item.includes(args.find)) {
                        renames.push({ from: item, to: item.replace(args.find, args.replace) });
                    }
                }
                if (args.dry_run) {
                    printInfo(`Dry run: ${renames.length} files would be renamed`);
                    return { success: true, content: renames.map(r => `${r.from} -> ${r.to}`).join('\n'), count: renames.length };
                }
                for (const r of renames) {
                    await fs.rename(path.join(dir, r.from), path.join(dir, r.to));
                }
                printSuccess(`Renamed ${renames.length} files`);
                return { success: true, count: renames.length };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'project_stats': {
            try {
                const dir = resolvePath(args.path || '.');
                const files = await searchFiles('**/*', dir);
                const stats = {};
                let totalLines = 0;
                const extMap = { '.js': 'JavaScript', '.ts': 'TypeScript', '.py': 'Python', '.java': 'Java', '.go': 'Go', '.rs': 'Rust', '.c': 'C', '.cpp': 'C++', '.jsx': 'JSX', '.tsx': 'TSX', '.vue': 'Vue', '.svelte': 'Svelte', '.css': 'CSS', '.html': 'HTML', '.json': 'JSON', '.md': 'Markdown' };
                for (const f of files.slice(0, 500)) {
                    const ext = path.extname(f).toLowerCase();
                    const lang = extMap[ext] || ext || 'other';
                    if (!stats[lang]) stats[lang] = { files: 0, lines: 0 };
                    stats[lang].files++;
                    try {
                        const content = await readFile(f);
                        if (content.success) {
                            const lines = content.content.split(/\r?\n/).length;
                            stats[lang].lines += lines;
                            totalLines += lines;
                        }
                    } catch { /* skip */ }
                }
                const content = Object.entries(stats)
                    .sort((a, b) => b[1].lines - a[1].lines)
                    .map(([lang, s]) => `${lang}: ${s.files} files, ${s.lines} lines`)
                    .join('\n');
                printInfo(`Project: ${files.length} files, ${totalLines} total lines`);
                return { success: true, content: `Total: ${files.length} files, ${totalLines} lines\n\n${content}`, totalFiles: files.length, totalLines };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'test_run': {
            try {
                let cmd = args.command;
                if (!cmd) {
                    try { await fs.access(path.join(cwd, 'package.json')); cmd = 'npm test'; }
                    catch { /* not node */ }
                    if (!cmd) try { await fs.access(path.join(cwd, 'pytest.ini')); cmd = 'python -m pytest'; } catch { /* */ }
                    if (!cmd) try { await fs.access(path.join(cwd, 'Cargo.toml')); cmd = 'cargo test'; } catch { /* */ }
                    if (!cmd) try { await fs.access(path.join(cwd, 'go.mod')); cmd = 'go test ./...'; } catch { /* */ }
                    if (!cmd) cmd = 'echo "No test runner detected"';
                }
                if (args.filter) cmd += ` -- ${args.filter}`;
                printInfo(`Running tests: ${cmd}`);
                return await executeCommand(cmd, { cwd, requireConfirmation: false });
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'lint_check': {
            try {
                let cmd;
                try { await fs.access(path.join(cwd, 'package.json')); cmd = args.fix ? 'npx eslint . --fix' : 'npx eslint .'; }
                catch { /* not node */ }
                if (!cmd) try { await fs.access(path.join(cwd, 'Cargo.toml')); cmd = 'cargo clippy'; } catch { /* */ }
                if (!cmd) cmd = 'echo "No linter detected"';
                printInfo(`Linting: ${cmd}`);
                return await executeCommand(cmd, { cwd, requireConfirmation: false });
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'dependency_check': {
            try {
                let cmd;
                try { await fs.access(path.join(cwd, 'package.json')); cmd = args.audit ? 'npm audit' : 'npm outdated'; }
                catch { /* not node */ }
                if (!cmd) try { await fs.access(path.join(cwd, 'requirements.txt')); cmd = 'pip list --outdated'; } catch { /* */ }
                if (!cmd) cmd = 'echo "No package manager detected"';
                printInfo(`Checking dependencies: ${cmd}`);
                return await executeCommand(cmd, { cwd, requireConfirmation: false });
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'http_request': {
            try {
                const method = args.method || 'GET';
                const headers = args.headers || {};
                const opts = { method, headers };
                if (args.body && (method === 'POST' || method === 'PUT')) {
                    opts.body = args.body;
                    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
                }
                const response = await fetch(args.url, opts);
                const text = await response.text();
                printInfo(`${method} ${args.url} -> ${response.status}`);
                return { success: true, status: response.status, content: text.slice(0, 10000), headers: Object.fromEntries(response.headers) };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'json_query': {
            try {
                const filePath = resolvePath(args.path);
                const raw = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(raw);
                const parts = args.query.split('.');
                let result = data;
                for (const part of parts) {
                    if (result === undefined || result === null) break;
                    result = result[part];
                }
                const content = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
                printInfo(`JSON query: ${args.query}`);
                return { success: true, content, value: result };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'regex_test': {
            try {
                const flags = args.flags || 'g';
                const regex = new RegExp(args.pattern, flags);
                const matches = [];
                let m;
                while ((m = regex.exec(args.text)) !== null) {
                    matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
                    if (!flags.includes('g')) break;
                }
                printInfo(`Regex: ${matches.length} match(es)`);
                return { success: true, matches, content: matches.map(m => `[${m.index}] "${m.match}"`).join('\n') };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'hash_file': {
            try {
                const crypto = await import('crypto');
                const filePath = resolvePath(args.path);
                const content = await fs.readFile(filePath);
                const algo = args.algorithm || 'sha256';
                const hash = crypto.createHash(algo).update(content).digest('hex');
                printInfo(`${algo.toUpperCase()}: ${hash.slice(0, 16)}...`);
                return { success: true, hash, algorithm: algo, content: `${algo}: ${hash}` };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'port_check': {
            try {
                const net = await import('net');
                return await new Promise((resolve) => {
                    const server = net.createServer();
                    server.once('error', () => {
                        printInfo(`Port ${args.port}: IN USE`);
                        resolve({ success: true, inUse: true, content: `Port ${args.port} is in use` });
                    });
                    server.once('listening', () => {
                        server.close();
                        printInfo(`Port ${args.port}: AVAILABLE`);
                        resolve({ success: true, inUse: false, content: `Port ${args.port} is available` });
                    });
                    server.listen(args.port);
                });
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'memory_store': {
            if (args.action === 'set') {
                memoryStore.set(args.key, args.value);
                printSuccess(`Stored: ${args.key}`);
                return { success: true };
            }
            if (args.action === 'get') {
                const val = memoryStore.get(args.key);
                return { success: true, content: val !== undefined ? val : `Key not found: ${args.key}`, value: val };
            }
            if (args.action === 'list') {
                const entries = [...memoryStore.entries()].map(([k, v]) => `${k}: ${v}`);
                return { success: true, content: entries.join('\n') || 'Empty', count: memoryStore.size };
            }
            if (args.action === 'delete') {
                memoryStore.delete(args.key);
                return { success: true };
            }
            return { success: false, error: 'Invalid action' };
        }

        case 'notebook': {
            try {
                const nbDir = path.join(cwd, '.mylocalcli', 'notebooks');
                await fs.mkdir(nbDir, { recursive: true });
                const nbPath = path.join(nbDir, `${args.name}.md`);
                if (args.action === 'create') {
                    const header = `# ${args.name}\n\nCreated: ${new Date().toISOString()}\n\n---\n\n${args.content || ''}\n`;
                    await fs.writeFile(nbPath, header);
                    printSuccess(`Notebook created: ${args.name}`);
                    return { success: true };
                }
                if (args.action === 'append') {
                    const timestamp = new Date().toLocaleTimeString();
                    await fs.appendFile(nbPath, `\n## [${timestamp}]\n\n${args.content}\n`);
                    printSuccess(`Appended to: ${args.name}`);
                    return { success: true };
                }
                if (args.action === 'read') {
                    const content = await fs.readFile(nbPath, 'utf-8');
                    return { success: true, content };
                }
                return { success: false, error: 'Invalid action' };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'git_branch': {
            try {
                if (args.action === 'list') {
                    const output = execSync('git branch -a', { cwd, encoding: 'utf-8' });
                    return { success: true, content: output.trim() };
                }
                if (args.action === 'create') {
                    execSync(`git checkout -b ${args.name}`, { cwd, encoding: 'utf-8' });
                    printSuccess(`Created branch: ${args.name}`);
                    return { success: true };
                }
                if (args.action === 'switch') {
                    execSync(`git checkout ${args.name}`, { cwd, encoding: 'utf-8' });
                    printSuccess(`Switched to: ${args.name}`);
                    return { success: true };
                }
                if (args.action === 'delete') {
                    execSync(`git branch -d ${args.name}`, { cwd, encoding: 'utf-8' });
                    printSuccess(`Deleted branch: ${args.name}`);
                    return { success: true };
                }
                return { success: false, error: 'Invalid action' };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'git_stash': {
            try {
                if (args.action === 'save') {
                    const msg = args.message ? `-m "${args.message}"` : '';
                    execSync(`git stash ${msg}`, { cwd, encoding: 'utf-8' });
                    printSuccess('Changes stashed');
                    return { success: true };
                }
                if (args.action === 'pop') {
                    execSync('git stash pop', { cwd, encoding: 'utf-8' });
                    printSuccess('Stash popped');
                    return { success: true };
                }
                if (args.action === 'list') {
                    const output = execSync('git stash list', { cwd, encoding: 'utf-8' });
                    return { success: true, content: output.trim() || 'No stashes' };
                }
                if (args.action === 'drop') {
                    execSync('git stash drop', { cwd, encoding: 'utf-8' });
                    return { success: true };
                }
                return { success: false, error: 'Invalid action' };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'TaskCreate': {
            try {
                const task = taskRegistry.createTask(args.instruction);
                printSuccess(`Task created: ${task.id}`);
                return { success: true, content: `Task created with ID ${task.id}` };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'TaskList': {
            try {
                const tasks = taskRegistry.listTasks();
                return { success: true, content: JSON.stringify(tasks, null, 2) };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'ListMcpResources': {
            try {
                const res = mcpRegistry.listResources();
                return { success: true, content: JSON.stringify(res, null, 2) };
            } catch (e) { return { success: false, error: e.message }; }
        }

        case 'LspGetSymbols': {
            try {
                const res = await lspClient.getSymbols(args.query);
                return { success: true, content: JSON.stringify(res, null, 2) };
            } catch (e) { return { success: false, error: e.message }; }
        }

        default:
            if (activeSkills.has(toolName)) {
                return await activeSkills.get(toolName).execute(args);
            }
            return { success: false, error: `Unknown tool: ${toolName}` };
    }
}

export async function initializeSkills() {
    const skills = await loadSkills();
    for (const skill of skills) {
        TOOLS.push(skill);
        activeSkills.set(skill.function.name, skill);
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

export default { TOOLS, executeTool, parseToolCalls, initializeSkills };
