import path from 'path';
import { listDirectory, searchFiles, readFile, getFileExtension, getLanguageFromExtension } from '../utils/files.js';
import { isGitRepo, getGitInfo } from '../utils/git.js';

// Codebase context builder
export async function buildContext(cwd) {
    const context = {
        currentDir: cwd,
        projectType: null,
        projectName: null,
        files: [],
        structure: null,
        gitInfo: null
    };

    // Detect project type
    context.projectType = await detectProjectType(cwd);

    // Get project structure
    context.structure = await listDirectory(cwd, { recursive: true, maxDepth: 3 });

    // Get git info if available
    if (await isGitRepo(cwd)) {
        context.gitInfo = await getGitInfo(cwd);
    }

    // Get important files
    context.files = await getImportantFiles(cwd, context.projectType);

    return context;
}

async function detectProjectType(cwd) {
    const detectors = [
        { file: 'package.json', type: 'nodejs' },
        { file: 'requirements.txt', type: 'python' },
        { file: 'pyproject.toml', type: 'python' },
        { file: 'Cargo.toml', type: 'rust' },
        { file: 'go.mod', type: 'go' },
        { file: 'pom.xml', type: 'java-maven' },
        { file: 'build.gradle', type: 'java-gradle' },
        { file: 'Gemfile', type: 'ruby' },
        { file: 'composer.json', type: 'php' },
        { file: 'pubspec.yaml', type: 'flutter' },
        { file: '.csproj', type: 'dotnet' }
    ];

    for (const detector of detectors) {
        const files = await searchFiles(`**/${detector.file}`, cwd);
        if (files.length > 0) {
            return detector.type;
        }
    }

    return 'unknown';
}

async function getImportantFiles(cwd, projectType) {
    const importantPatterns = {
        nodejs: ['package.json', 'tsconfig.json', 'README.md', 'src/index.js', 'src/index.ts'],
        python: ['requirements.txt', 'setup.py', 'pyproject.toml', 'README.md', 'main.py', 'app.py'],
        rust: ['Cargo.toml', 'src/main.rs', 'src/lib.rs', 'README.md'],
        go: ['go.mod', 'main.go', 'README.md'],
        unknown: ['README.md', 'Makefile', 'Dockerfile']
    };

    const patterns = importantPatterns[projectType] || importantPatterns.unknown;
    const files = [];

    for (const pattern of patterns) {
        const matches = await searchFiles(pattern, cwd);
        files.push(...matches.slice(0, 2));
    }

    return [...new Set(files)].slice(0, 10);
}

export async function getRelevantContext(cwd, query) {
    // Find files that might be relevant to the query
    const context = await buildContext(cwd);
    const relevantFiles = [];

    // Extract potential file names or patterns from query
    const patterns = extractPatterns(query);

    for (const pattern of patterns) {
        const files = await searchFiles(`**/*${pattern}*`, cwd);
        relevantFiles.push(...files.slice(0, 3));
    }

    // Add first few important files
    relevantFiles.push(...context.files.slice(0, 5));

    // Remove duplicates and limit
    const uniqueFiles = [...new Set(relevantFiles)].slice(0, 10);

    // Read file contents
    const fileContents = [];
    for (const file of uniqueFiles) {
        const result = await readFile(file);
        if (result.success && result.content.length < 50000) {
            const ext = getFileExtension(file);
            const lang = getLanguageFromExtension(ext);
            fileContents.push({
                path: path.relative(cwd, file),
                language: lang,
                content: result.content
            });
        }
    }

    return {
        ...context,
        relevantFiles: fileContents
    };
}

function extractPatterns(query) {
    // Extract potential file names or keywords
    const patterns = [];

    // Match file names
    const fileMatch = query.match(/\b[\w-]+\.(js|ts|py|go|rs|java|c|cpp|h|json|yaml|yml|md|txt)\b/gi);
    if (fileMatch) {
        patterns.push(...fileMatch);
    }

    // Match quoted strings
    const quoted = query.match(/"([^"]+)"|'([^']+)'/g);
    if (quoted) {
        patterns.push(...quoted.map(q => q.replace(/['"]/g, '')));
    }

    return patterns;
}

export function formatContextForPrompt(context) {
    const parts = [];

    if (context.projectType && context.projectType !== 'unknown') {
        parts.push(`Project Type: ${context.projectType}`);
    }

    if (context.gitInfo) {
        parts.push(`Git Branch: ${context.gitInfo.branch}`);
        if (context.gitInfo.hasChanges) {
            parts.push(`Uncommitted changes: ${context.gitInfo.changedFiles} files`);
        }
    }

    if (context.relevantFiles && context.relevantFiles.length > 0) {
        parts.push('\n--- RELEVANT FILES ---\n');
        for (const file of context.relevantFiles) {
            parts.push(`\n### ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\``);
        }
    }

    return parts.join('\n');
}

export default {
    buildContext,
    getRelevantContext,
    formatContextForPrompt
};
