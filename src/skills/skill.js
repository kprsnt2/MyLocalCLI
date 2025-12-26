// MyLocalCLI - Modular Skills System
// Context-aware knowledge injection inspired by Claude Code
// Skills are loaded from individual SKILL.md files

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { printInfo, printSuccess, colors } from '../ui/terminal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Skill definition structure
 * @typedef {Object} Skill
 * @property {string} name - Skill name
 * @property {string} description - What this skill provides
 * @property {string[]} globs - File patterns that trigger this skill
 * @property {string[]} alwaysApply - Patterns for always applying
 * @property {number} priority - Higher priority skills appear first (default: 50)
 * @property {string[]} tags - Categories for grouping skills
 * @property {string} content - The skill knowledge content
 * @property {string} source - Path to the SKILL.md file
 * @property {boolean} isBuiltin - Whether this is a built-in skill
 * @property {boolean} isCustom - Whether this is a user-defined skill
 */

// Registry of available skills
const SKILLS = new Map();

// Skill categories
export const SKILL_CATEGORIES = {
    LANGUAGE: 'language',
    FRAMEWORK: 'framework',
    TOOL: 'tool',
    WORKFLOW: 'workflow',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    DATABASE: 'database',
    DEVOPS: 'devops'
};

// Built-in skills directory
const BUILTIN_SKILLS_DIR = path.join(__dirname, 'builtin');

/**
 * Parse YAML-like frontmatter from a skill file
 * @param {string} content - File content
 * @returns {{ meta: Object, body: string }}
 */
function parseFrontmatter(content) {
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

                // Parse numbers
                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }

                meta[key] = value;
            }
        }
    }

    return { meta, body };
}

/**
 * Parse a SKILL.md file
 * @param {string} filePath - Path to the SKILL.md file
 * @returns {Promise<Skill|null>}
 */
export async function parseSkillFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);

        return {
            name: meta.name || path.basename(path.dirname(filePath)),
            description: meta.description || '',
            version: meta.version || '1.0.0',
            priority: meta.priority || 50,
            globs: meta.globs || [],
            alwaysApply: meta.alwaysApply || [],
            tags: meta.tags || [],
            content: body,
            source: filePath,
            isBuiltin: filePath.includes('builtin'),
            isCustom: !filePath.includes('builtin')
        };
    } catch (error) {
        // File doesn't exist or can't be read
        return null;
    }
}

/**
 * Load skills from a directory
 * @param {string} dir - Directory containing skill folders
 * @param {Object} options - Options
 * @returns {Promise<number>} - Number of skills loaded
 */
async function loadSkillsFromDirectory(dir, options = {}) {
    const { isBuiltin = false } = options;
    let count = 0;

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Look for SKILL.md in the folder
                const skillPath = path.join(dir, entry.name, 'SKILL.md');
                const skill = await parseSkillFile(skillPath);
                if (skill) {
                    skill.isBuiltin = isBuiltin;
                    skill.isCustom = !isBuiltin;
                    SKILLS.set(skill.name, skill);
                    count++;
                }
            } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
                // Also support single-file skills (e.g., python.md)
                const skillPath = path.join(dir, entry.name);
                const skill = await parseSkillFile(skillPath);
                if (skill) {
                    skill.isBuiltin = isBuiltin;
                    skill.isCustom = !isBuiltin;
                    SKILLS.set(skill.name, skill);
                    count++;
                }
            }
        }
    } catch (error) {
        // Directory doesn't exist
    }

    return count;
}

/**
 * Load all skills (built-in and custom)
 * @param {string} cwd - Current working directory
 */
export async function loadSkills(cwd) {
    // Clear existing skills
    SKILLS.clear();

    // Load built-in skills
    const builtinCount = await loadSkillsFromDirectory(BUILTIN_SKILLS_DIR, { isBuiltin: true });

    // Load custom skills from user directories
    const customDirs = [
        path.join(os.homedir(), '.mylocalcli', 'skills'),
        path.join(cwd, '.mylocalcli', 'skills')
    ];

    let customCount = 0;
    for (const dir of customDirs) {
        customCount += await loadSkillsFromDirectory(dir, { isBuiltin: false });
    }

    if (customCount > 0) {
        printInfo(`Loaded ${customCount} custom skill(s)`);
    }

    return getAllSkills();
}

/**
 * Initialize built-in skills (async initialization)
 */
export async function initializeBuiltinSkills() {
    await loadSkillsFromDirectory(BUILTIN_SKILLS_DIR, { isBuiltin: true });
}

/**
 * Register a skill
 * @param {Skill} skill - Skill to register
 */
export function registerSkill(skill) {
    skill.priority = skill.priority || 50;
    skill.tags = skill.tags || [];
    SKILLS.set(skill.name, skill);
}

/**
 * Unregister a skill
 * @param {string} name - Skill name
 */
export function unregisterSkill(name) {
    return SKILLS.delete(name);
}

/**
 * Get a skill by name
 * @param {string} name - Skill name
 */
export function getSkill(name) {
    return SKILLS.get(name);
}

/**
 * Get all registered skills
 * @param {Object} options - Filter options
 */
export function getAllSkills(options = {}) {
    let skills = Array.from(SKILLS.values());

    if (options.category || options.tag) {
        skills = skills.filter(skill =>
            skill.tags?.includes(options.category || options.tag)
        );
    }

    if (options.builtinOnly) {
        skills = skills.filter(skill => skill.isBuiltin);
    }

    if (options.customOnly) {
        skills = skills.filter(skill => skill.isCustom);
    }

    // Sort by priority (higher first)
    return skills.sort((a, b) => (b.priority || 50) - (a.priority || 50));
}

/**
 * Get skills grouped by category
 */
export function getSkillsByCategory() {
    const byCategory = {};

    for (const skill of SKILLS.values()) {
        const category = skill.tags?.[0] || 'other';
        if (!byCategory[category]) {
            byCategory[category] = [];
        }
        byCategory[category].push(skill);
    }

    // Sort each category by priority
    for (const category of Object.keys(byCategory)) {
        byCategory[category].sort((a, b) => (b.priority || 50) - (a.priority || 50));
    }

    return byCategory;
}

/**
 * Check if a file path matches a glob pattern
 */
function matchGlob(pattern, filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    const normalizedPattern = pattern.replace(/\\/g, '/').toLowerCase();

    let regex = normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '{{DOUBLESTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\{\{DOUBLESTAR\}\}/g, '.*');

    if (!regex.startsWith('.*')) {
        regex = `(^|.*)${regex}`;
    }
    regex = `${regex}($|.*)`;

    try {
        return new RegExp(regex).test(normalizedPath);
    } catch (e) {
        return false;
    }
}

/**
 * Find skills that match given file paths
 * @param {string[]} files - List of file paths
 * @param {Object} options - Options
 */
export function findMatchingSkills(files, options = {}) {
    const { maxSkills = 5 } = options;
    const matchedSkills = new Map();

    for (const skill of SKILLS.values()) {
        let matchCount = 0;

        for (const file of files) {
            for (const glob of skill.globs || []) {
                if (matchGlob(glob, file)) {
                    matchCount++;
                    break;
                }
            }

            for (const pattern of skill.alwaysApply || []) {
                if (matchGlob(pattern, file)) {
                    matchCount += 3;
                    break;
                }
            }
        }

        if (matchCount > 0) {
            matchedSkills.set(skill.name, {
                skill,
                matchCount,
                priority: skill.priority || 50
            });
        }
    }

    return Array.from(matchedSkills.values())
        .sort((a, b) => (b.matchCount * b.priority) - (a.matchCount * a.priority))
        .slice(0, maxSkills)
        .map(entry => entry.skill);
}

/**
 * Get skill content to inject into context
 * @param {string[]} files - List of file paths
 * @param {Object} options - Options
 */
export function getSkillContext(files, options = {}) {
    const { maxSkills = 4, maxLength = 8000 } = options;
    const skills = findMatchingSkills(files, { maxSkills });

    if (skills.length === 0) {
        return '';
    }

    const lines = ['## Relevant Best Practices\n'];
    let totalLength = lines[0].length;

    for (const skill of skills) {
        const header = `### ${skill.name} (${skill.description})\n\n`;
        const content = skill.content + '\n\n';

        if (totalLength + header.length + content.length > maxLength) {
            const remainingSpace = maxLength - totalLength - header.length - 100;
            if (remainingSpace > 200) {
                lines.push(header);
                lines.push(content.slice(0, remainingSpace) + '\n...[truncated]\n\n');
            }
            break;
        }

        lines.push(header);
        lines.push(content);
        totalLength += header.length + content.length;
    }

    return lines.join('');
}

/**
 * Create a new skill from template
 * @param {string} name - Skill name
 * @param {string} directory - Directory to create skill in
 */
export async function createSkillTemplate(name, directory) {
    const skillDir = path.join(directory, '.mylocalcli', 'skills', name);
    const skillPath = path.join(skillDir, 'SKILL.md');

    await fs.mkdir(skillDir, { recursive: true });

    const template = `---
name: "${name}"
description: "Description of what this skill provides"
priority: 50
globs: ["**/*.js", "**/*.ts"]
tags: ["custom"]
---

# ${name.charAt(0).toUpperCase() + name.slice(1)} Best Practices

## Section 1

- Best practice 1
- Best practice 2
- Best practice 3

## Section 2

- More practices here
`;

    await fs.writeFile(skillPath, template);
    printSuccess(`Created skill template: ${skillPath}`);
    return skillPath;
}

/**
 * Search skills by keyword
 * @param {string} query - Search query
 */
export function searchSkills(query) {
    const lowerQuery = query.toLowerCase();
    return getAllSkills().filter(skill =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.content.toLowerCase().includes(lowerQuery) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Print skills list
 */
export function printSkillsList(options = {}) {
    const { grouped = false, verbose = false } = options;

    console.log('\n' + colors.primary('━━━ Available Skills ━━━') + '\n');

    if (grouped) {
        const byCategory = getSkillsByCategory();
        const categoryNames = {
            [SKILL_CATEGORIES.LANGUAGE]: '📚 Languages',
            [SKILL_CATEGORIES.FRAMEWORK]: '🏗️  Frameworks',
            [SKILL_CATEGORIES.TOOL]: '🔧 Tools',
            [SKILL_CATEGORIES.WORKFLOW]: '📋 Workflows',
            [SKILL_CATEGORIES.SECURITY]: '🔒 Security',
            [SKILL_CATEGORIES.PERFORMANCE]: '⚡ Performance',
            [SKILL_CATEGORIES.DATABASE]: '🗄️  Databases',
            [SKILL_CATEGORIES.DEVOPS]: '🚀 DevOps',
            'other': '📦 Other'
        };

        for (const [category, skills] of Object.entries(byCategory)) {
            console.log(`  ${categoryNames[category] || category}`);
            console.log('  ' + colors.muted('─'.repeat(30)));

            for (const skill of skills) {
                const badge = skill.isCustom ? colors.secondary(' [custom]') : '';
                console.log(`    ${colors.success('◆')} ${colors.primary(skill.name)}${badge}`);
                if (verbose) {
                    console.log(`      ${colors.muted(skill.description)}`);
                }
            }
            console.log();
        }
    } else {
        const skills = getAllSkills();

        if (skills.length === 0) {
            console.log('  ' + colors.muted('No skills loaded. Run with a project to load skills.'));
            return;
        }

        for (const skill of skills) {
            const badge = skill.isCustom ? colors.secondary(' [custom]') : '';
            console.log(`  ${colors.success('◆')} ${colors.primary(skill.name)}${badge}`);
            console.log(`    ${colors.muted(skill.description)}`);
        }
        console.log();
    }

    const builtinCount = getAllSkills({ builtinOnly: true }).length;
    const customCount = getAllSkills({ customOnly: true }).length;

    console.log(colors.muted(`  Total: ${SKILLS.size} skills (${builtinCount} built-in, ${customCount} custom)`));
    console.log(colors.muted('  Skills are auto-applied based on file context'));
    console.log(colors.muted('  Create custom skills in .mylocalcli/skills/'));
    console.log();
}

/**
 * Get skill info for display
 * @param {string} name - Skill name
 */
export function getSkillInfo(name) {
    const skill = SKILLS.get(name);
    if (!skill) return null;

    return {
        name: skill.name,
        description: skill.description,
        priority: skill.priority,
        globs: skill.globs,
        tags: skill.tags,
        source: skill.source,
        isBuiltin: skill.isBuiltin,
        isCustom: skill.isCustom,
        contentPreview: skill.content.slice(0, 500) + (skill.content.length > 500 ? '...' : '')
    };
}

export default {
    loadSkills,
    initializeBuiltinSkills,
    registerSkill,
    unregisterSkill,
    getSkill,
    getSkillInfo,
    getAllSkills,
    getSkillsByCategory,
    parseSkillFile,
    createSkillTemplate,
    findMatchingSkills,
    getSkillContext,
    printSkillsList,
    searchSkills,
    SKILL_CATEGORIES,
    BUILTIN_SKILLS_DIR
};
