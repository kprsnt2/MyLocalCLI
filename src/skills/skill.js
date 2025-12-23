// MyLocalCLI - Skills System
// Context-aware knowledge injection inspired by Claude Code

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { printInfo, colors } from '../ui/terminal.js';

/**
 * Skill definition structure
 * @typedef {Object} Skill
 * @property {string} name - Skill name
 * @property {string} description - What this skill provides
 * @property {string[]} globs - File patterns that trigger this skill
 * @property {string[]} alwaysApply - Patterns for always applying
 * @property {string} content - The skill knowledge content
 */

// Registry of available skills
const SKILLS = new Map();

// Built-in skills
const BUILTIN_SKILLS = [
    {
        name: 'javascript',
        description: 'Best practices for JavaScript/TypeScript development',
        globs: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        content: `# JavaScript/TypeScript Best Practices

## Code Style
- Use const by default, let when reassignment is needed
- Use template literals for string interpolation
- Prefer arrow functions for callbacks
- Use destructuring for object/array access
- Use async/await over .then() chains

## Error Handling
- Always handle promise rejections
- Use try/catch with async/await
- Provide meaningful error messages
- Don't swallow errors silently

## Modern Patterns
- Use optional chaining (?.) and nullish coalescing (??)
- Use spread operator for object/array copies
- Use Map/Set for complex data structures
- Prefer for...of over forEach for iterables

## TypeScript Specific
- Prefer interfaces over type aliases for objects
- Use strict mode
- Avoid any type
- Use generics for reusable code`
    },
    {
        name: 'python',
        description: 'Best practices for Python development',
        globs: ['**/*.py'],
        content: `# Python Best Practices

## Code Style
- Follow PEP 8 style guide
- Use snake_case for functions/variables
- Use PascalCase for classes
- Maximum line length: 88 (Black) or 79 (PEP 8)

## Modern Python
- Use f-strings for formatting
- Use pathlib for file paths
- Use dataclasses or Pydantic for data models
- Type hints for function signatures
- Use walrus operator := where appropriate

## Error Handling
- Be specific with exception types
- Use context managers (with) for resources
- Log exceptions with traceback

## Virtual Environments
- Always use virtual environments
- Pin dependency versions
- Use requirements.txt or pyproject.toml`
    },
    {
        name: 'git-workflow',
        description: 'Git best practices and workflows',
        globs: ['**/.git/**', '**/.gitignore'],
        alwaysApply: ['**/CONTRIBUTING.md'],
        content: `# Git Workflow Best Practices

## Commit Messages
- Use imperative mood: "Add feature" not "Added feature"
- First line: max 50 chars, summary
- Body: explain what and why, not how
- Reference issues: "Fixes #123"

## Branch Naming
- feature/description
- fix/description
- refactor/description
- docs/description

## Workflow
- Keep commits atomic and focused
- Rebase feature branches on main
- Squash WIP commits before merge
- Never force push to shared branches

## .gitignore
- Ignore build artifacts
- Ignore dependency directories
- Ignore local config files
- Ignore IDE settings`
    },
    {
        name: 'react',
        description: 'React development patterns and best practices',
        globs: ['**/*.jsx', '**/*.tsx', '**/package.json'],
        content: `# React Best Practices

## Component Design
- Keep components small and focused
- Prefer functional components with hooks
- Use composition over inheritance
- Lift state only when needed

## Hooks
- Use useState for local state
- Use useEffect for side effects
- Use useCallback/useMemo to prevent rerenders
- Create custom hooks for reusable logic
- Always include dependencies array

## Performance
- Use React.memo for expensive components
- Lazy load routes and heavy components
- Use keys properly in lists (never use index)
- Avoid inline objects/functions in JSX

## State Management
- Start with local state
- Use Context for theme/auth
- Consider Zustand/Redux for complex apps
- Use React Query for server state`
    },
    {
        name: 'nodejs',
        description: 'Node.js server development patterns',
        globs: ['**/package.json', '**/server.js', '**/app.js', '**/index.js'],
        content: `# Node.js Best Practices

## Project Structure
- src/ for source code
- lib/ for utilities
- tests/ for test files
- Keep entry point minimal

## Async Patterns
- Use async/await everywhere
- Handle all promise rejections
- Use Promise.all for parallel tasks
- Set timeouts for external calls

## Error Handling
- Use centralized error handler
- Log errors with context
- Return appropriate status codes
- Never expose stack traces in production

## Environment
- Use .env for local config
- Validate env variables at startup
- Use different configs per environment
- Never commit secrets

## Security
- Validate all input
- Use helmet for HTTP headers
- Rate limit APIs
- Keep dependencies updated`
    },
    {
        name: 'testing',
        description: 'Testing patterns and best practices',
        globs: ['**/*.test.js', '**/*.spec.js', '**/*.test.ts', '**/*.spec.ts', '**/test/**', '**/tests/**', '**/__tests__/**'],
        content: `# Testing Best Practices

## Test Structure
- Arrange: Set up test data
- Act: Execute the code
- Assert: Verify results
- Use descriptive test names

## Unit Tests
- Test one thing per test
- Mock external dependencies
- Test edge cases
- Aim for high coverage

## Integration Tests
- Test component interactions
- Use test database
- Clean up after tests
- Test happy and error paths

## E2E Tests
- Test critical user flows
- Keep tests independent
- Use stable selectors
- Handle async properly

## Mocking
- Mock at boundaries
- Use factories for test data
- Don't over-mock
- Reset mocks between tests`
    }
];

/**
 * Initialize built-in skills
 */
export function initializeBuiltinSkills() {
    for (const skill of BUILTIN_SKILLS) {
        SKILLS.set(skill.name, skill);
    }
}

/**
 * Register a skill
 */
export function registerSkill(skill) {
    SKILLS.set(skill.name, skill);
}

/**
 * Get a skill by name
 */
export function getSkill(name) {
    return SKILLS.get(name);
}

/**
 * Get all registered skills
 */
export function getAllSkills() {
    return Array.from(SKILLS.values());
}

/**
 * Check if a file path matches a glob pattern
 * Simple glob matching (supports * and **)
 */
function matchGlob(pattern, filePath) {
    // Normalize paths
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Convert glob to regex
    let regex = normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '{{DOUBLESTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\{\{DOUBLESTAR\}\}/g, '.*');

    regex = `^${regex}$`;

    try {
        return new RegExp(regex).test(normalizedPath);
    } catch (e) {
        return false;
    }
}

/**
 * Find skills that match given file paths
 * @param {string[]} files - List of file paths
 */
export function findMatchingSkills(files) {
    const matchedSkills = new Set();

    for (const skill of SKILLS.values()) {
        for (const file of files) {
            // Check globs
            for (const glob of skill.globs || []) {
                if (matchGlob(glob, file)) {
                    matchedSkills.add(skill.name);
                    break;
                }
            }

            // Check alwaysApply
            for (const pattern of skill.alwaysApply || []) {
                if (matchGlob(pattern, file)) {
                    matchedSkills.add(skill.name);
                    break;
                }
            }
        }
    }

    return Array.from(matchedSkills).map(name => SKILLS.get(name));
}

/**
 * Get skill content to inject into context based on file paths
 * @param {string[]} files - List of file paths in the project
 */
export function getSkillContext(files) {
    const skills = findMatchingSkills(files);

    if (skills.length === 0) {
        return '';
    }

    const lines = ['## Relevant Best Practices', ''];

    for (const skill of skills) {
        lines.push(`### ${skill.name}`);
        lines.push('');
        lines.push(skill.content);
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Load skills from SKILL.md files
 * Looks in:
 * - ~/.mylocalcli/skills/
 * - .mylocalcli/skills/
 */
export async function loadSkills(cwd) {
    // Initialize built-in skills first
    initializeBuiltinSkills();

    const locations = [
        path.join(os.homedir(), '.mylocalcli', 'skills'),
        path.join(cwd, '.mylocalcli', 'skills')
    ];

    for (const dir of locations) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const skillPath = path.join(dir, entry.name, 'SKILL.md');
                    try {
                        const skill = await parseSkillFile(skillPath);
                        if (skill) {
                            registerSkill(skill);
                        }
                    } catch (error) {
                        // SKILL.md not found
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist - that's fine
        }
    }

    return getAllSkills();
}

/**
 * Parse a SKILL.md file
 */
export async function parseSkillFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        const meta = {};
        let body = content;

        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            body = content.slice(frontmatterMatch[0].length).trim();

            for (const line of frontmatter.split('\n')) {
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    const key = line.slice(0, colonIdx).trim();
                    let value = line.slice(colonIdx + 1).trim();

                    // Remove quotes
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    // Parse arrays
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            // Keep as string
                        }
                    }

                    meta[key] = value;
                }
            }
        }

        return {
            name: meta.name || path.basename(path.dirname(filePath)),
            description: meta.description || '',
            version: meta.version || '1.0.0',
            globs: meta.globs || [],
            alwaysApply: meta.alwaysApply || [],
            content: body,
            source: filePath
        };
    } catch (error) {
        console.error(`Failed to parse skill file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Print skills list
 */
export function printSkillsList() {
    console.log('\n' + colors.primary('━━━ Available Skills ━━━') + '\n');

    const skills = getAllSkills();

    if (skills.length === 0) {
        console.log('  ' + colors.muted('No skills available'));
        return;
    }

    for (const skill of skills) {
        console.log(`  ${colors.success('◆')} ${colors.primary(skill.name)}`);
        console.log(`    ${colors.muted(skill.description)}`);
        if (skill.globs && skill.globs.length > 0) {
            console.log(`    ${colors.muted('Triggers:')} ${skill.globs.slice(0, 3).join(', ')}${skill.globs.length > 3 ? '...' : ''}`);
        }
        console.log();
    }

    console.log(colors.muted('  Skills are auto-applied based on file context'));
    console.log();
}

// Initialize built-in skills on module load
initializeBuiltinSkills();

export default {
    initializeBuiltinSkills,
    registerSkill,
    getSkill,
    getAllSkills,
    loadSkills,
    parseSkillFile,
    findMatchingSkills,
    getSkillContext,
    printSkillsList,
    BUILTIN_SKILLS
};
