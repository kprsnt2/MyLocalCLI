import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// File system utilities
export async function readFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function writeFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function listDirectory(dirPath, options = {}) {
    const { recursive = false, maxDepth = 3 } = options;

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const items = [];

        for (const entry of entries) {
            // Skip hidden files and common ignore patterns
            if (entry.name.startsWith('.') ||
                entry.name === 'node_modules' ||
                entry.name === '__pycache__' ||
                entry.name === 'dist' ||
                entry.name === 'build') {
                continue;
            }

            const fullPath = path.join(dirPath, entry.name);
            const item = {
                name: entry.name,
                path: fullPath,
                type: entry.isDirectory() ? 'directory' : 'file'
            };

            if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                item.size = stats.size;
            }

            items.push(item);

            if (recursive && entry.isDirectory() && maxDepth > 1) {
                const subItems = await listDirectory(fullPath, {
                    recursive: true,
                    maxDepth: maxDepth - 1
                });
                item.children = subItems;
            }
        }

        return items;
    } catch (error) {
        return [];
    }
}

export async function searchFiles(pattern, cwd) {
    try {
        const files = await glob(pattern, {
            cwd,
            ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
            nodir: true
        });
        return files.map(f => path.join(cwd, f));
    } catch (error) {
        return [];
    }
}

export async function getFileStats(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile()
        };
    } catch {
        return null;
    }
}

export function getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
}

export function getFileName(filePath) {
    return path.basename(filePath);
}

export function getLanguageFromExtension(ext) {
    const langMap = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.h': 'c',
        '.hpp': 'cpp',
        '.cs': 'csharp',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.r': 'r',
        '.sql': 'sql',
        '.sh': 'bash',
        '.bash': 'bash',
        '.zsh': 'zsh',
        '.ps1': 'powershell',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.xml': 'xml',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.less': 'less',
        '.md': 'markdown',
        '.txt': 'text'
    };
    return langMap[ext] || 'text';
}

export default {
    readFile,
    writeFile,
    fileExists,
    listDirectory,
    searchFiles,
    getFileStats,
    getFileExtension,
    getFileName,
    getLanguageFromExtension
};
