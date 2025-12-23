// MyLocalCLI - Project Configuration System
// Reads MYLOCALCLI.md from project root (similar to Claude Code's CLAUDE.md)

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Project configuration structure
 * @typedef {Object} ProjectConfig
 * @property {string} content - The markdown content
 * @property {string} source - Path to the config file
 * @property {Object} meta - Parsed frontmatter metadata
 */

// Cache for project configs
const CONFIG_CACHE = new Map();

/**
 * Load project configuration from MYLOCALCLI.md
 * Looks in order:
 * 1. Current directory / MYLOCALCLI.md
 * 2. Current directory / .mylocalcli/config.md
 * 3. ~/.mylocalcli/config.md (global fallback)
 * 
 * @param {string} cwd - Current working directory
 * @returns {Promise<ProjectConfig|null>}
 */
export async function loadProjectConfig(cwd) {
    // Check cache first
    if (CONFIG_CACHE.has(cwd)) {
        return CONFIG_CACHE.get(cwd);
    }

    const locations = [
        path.join(cwd, 'MYLOCALCLI.md'),
        path.join(cwd, '.mylocalcli', 'config.md'),
        path.join(os.homedir(), '.mylocalcli', 'config.md')
    ];

    for (const configPath of locations) {
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const config = parseProjectConfig(content, configPath);
            CONFIG_CACHE.set(cwd, config);
            return config;
        } catch (error) {
            // File doesn't exist, try next location
        }
    }

    // No config found
    CONFIG_CACHE.set(cwd, null);
    return null;
}

/**
 * Parse project config file
 * Supports YAML frontmatter for metadata
 */
function parseProjectConfig(content, sourcePath) {
    const meta = {};
    let body = content;

    // Parse YAML frontmatter if present
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
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

                // Parse booleans
                if (value === 'true') value = true;
                else if (value === 'false') value = false;

                // Parse arrays
                if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
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
        content: body,
        source: sourcePath,
        meta,
        // Convenience getters
        projectName: meta.name || path.basename(path.dirname(sourcePath)),
        description: meta.description || '',
        preferredModel: meta.model || null,
        customTools: meta.tools || [],
        disabledTools: meta.disabledTools || [],
        alwaysAllow: meta.alwaysAllow || []
    };
}

/**
 * Format project config for injection into system prompt
 */
export function formatProjectConfigForPrompt(config) {
    if (!config) return '';

    let prompt = '\n\n## PROJECT CONFIGURATION\n\n';

    if (config.projectName) {
        prompt += `**Project:** ${config.projectName}\n`;
    }

    if (config.description) {
        prompt += `**Description:** ${config.description}\n`;
    }

    prompt += '\n**Project Instructions:**\n\n';
    prompt += config.content;
    prompt += '\n';

    return prompt;
}

/**
 * Clear the config cache (useful for testing or when config changes)
 */
export function clearConfigCache() {
    CONFIG_CACHE.clear();
}

/**
 * Create a default MYLOCALCLI.md template
 */
export function getDefaultConfigTemplate(projectName = 'My Project') {
    return `---
name: ${projectName}
description: Project configuration for MyLocalCLI
---

# Project Instructions

This is the configuration file for MyLocalCLI. Add any project-specific instructions here.

## Coding Standards

- Follow the existing code style
- Add comments for complex logic
- Write tests for new features

## Important Files

- \`src/\` - Main source code
- \`package.json\` - Project dependencies

## Notes

Add any project-specific notes or context here that the AI should know about.
`;
}

/**
 * Create MYLOCALCLI.md in the specified directory
 */
export async function createProjectConfig(cwd, customContent = null) {
    const configPath = path.join(cwd, 'MYLOCALCLI.md');
    const content = customContent || getDefaultConfigTemplate(path.basename(cwd));

    await fs.writeFile(configPath, content, 'utf-8');
    clearConfigCache(); // Clear cache so new config is loaded

    return configPath;
}

export default {
    loadProjectConfig,
    formatProjectConfigForPrompt,
    clearConfigCache,
    getDefaultConfigTemplate,
    createProjectConfig
};
