// MyLocalCLI - Plugin Loader
// Inspired by Claude Code plugin discovery and loading

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { registerCustomCommand, parseCommandFile } from '../core/commands.js';

/**
 * Plugin metadata structure
 * @typedef {Object} Plugin
 * @property {string} name - Plugin name
 * @property {string} version - Plugin version
 * @property {string} description - Plugin description
 * @property {string} root - Plugin root directory
 * @property {Array} commands - Loaded commands
 * @property {Array} agents - Loaded agents
 * @property {Array} skills - Loaded skills
 * @property {Object} hooks - Loaded hooks configuration
 * @property {boolean} enabled - Whether plugin is enabled
 */

// Registry of loaded plugins
const PLUGINS = new Map();

/**
 * Get all plugin search locations
 */
function getPluginLocations(cwd) {
    return [
        // Global plugins
        path.join(os.homedir(), '.mylocalcli', 'plugins'),
        // Project-local plugins
        path.join(cwd, '.mylocalcli', 'plugins')
    ];
}

/**
 * Discover and load all plugins
 * @param {string} cwd - Current working directory
 */
export async function loadPlugins(cwd) {
    const locations = getPluginLocations(cwd);

    for (const pluginDir of locations) {
        try {
            const entries = await fs.readdir(pluginDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const pluginPath = path.join(pluginDir, entry.name);
                    await loadPlugin(pluginPath);
                }
            }
        } catch (error) {
            // Directory doesn't exist - that's fine
        }
    }

    return Array.from(PLUGINS.values());
}

/**
 * Load a single plugin from a directory
 * @param {string} pluginPath - Absolute path to plugin directory
 */
export async function loadPlugin(pluginPath) {
    try {
        // Check for plugin manifest
        const manifestPath = path.join(pluginPath, '.mylocalcli', 'plugin.json');
        let manifest = { name: path.basename(pluginPath) };

        try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            manifest = { ...manifest, ...JSON.parse(manifestContent) };
        } catch (error) {
            // No manifest file - use defaults
        }

        const plugin = {
            name: manifest.name,
            version: manifest.version || '1.0.0',
            description: manifest.description || '',
            author: manifest.author || '',
            root: pluginPath,
            commands: [],
            agents: [],
            skills: [],
            hooks: null,
            enabled: true
        };

        // Load commands
        const commandsDir = path.join(pluginPath, 'commands');
        try {
            const commandFiles = await fs.readdir(commandsDir);
            for (const file of commandFiles) {
                if (file.endsWith('.md')) {
                    const commandPath = path.join(commandsDir, file);
                    const command = await parseCommandFile(commandPath);
                    if (command) {
                        command.plugin = plugin.name;
                        plugin.commands.push(command);
                        registerCustomCommand(command);
                    }
                }
            }
        } catch (error) {
            // No commands directory
        }

        // Load agents
        const agentsDir = path.join(pluginPath, 'agents');
        try {
            const agentFiles = await fs.readdir(agentsDir);
            for (const file of agentFiles) {
                if (file.endsWith('.md')) {
                    const agentPath = path.join(agentsDir, file);
                    const agent = await parseAgentFile(agentPath);
                    if (agent) {
                        agent.plugin = plugin.name;
                        plugin.agents.push(agent);
                    }
                }
            }
        } catch (error) {
            // No agents directory
        }

        // Load skills
        const skillsDir = path.join(pluginPath, 'skills');
        try {
            const skillDirs = await fs.readdir(skillsDir, { withFileTypes: true });
            for (const entry of skillDirs) {
                if (entry.isDirectory()) {
                    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
                    try {
                        const skill = await parseSkillFile(skillPath);
                        if (skill) {
                            skill.plugin = plugin.name;
                            skill.root = path.join(skillsDir, entry.name);
                            plugin.skills.push(skill);
                        }
                    } catch (error) {
                        // SKILL.md not found
                    }
                }
            }
        } catch (error) {
            // No skills directory
        }

        // Load hooks
        const hooksPath = path.join(pluginPath, 'hooks', 'hooks.json');
        try {
            const hooksContent = await fs.readFile(hooksPath, 'utf-8');
            plugin.hooks = JSON.parse(hooksContent);
            // Replace ${PLUGIN_ROOT} with actual path
            plugin.hooks = replacePluginRoot(plugin.hooks, pluginPath);
        } catch (error) {
            // No hooks file
        }

        PLUGINS.set(plugin.name, plugin);
        return plugin;

    } catch (error) {
        console.error(`Failed to load plugin from ${pluginPath}:`, error.message);
        return null;
    }
}

/**
 * Parse an agent markdown file
 */
async function parseAgentFile(filePath) {
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
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    // Handle arrays
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
            name: meta.name || path.basename(filePath, '.md'),
            description: meta.description || '',
            model: meta.model || 'inherit',
            tools: meta.tools || [],
            color: meta.color || 'cyan',
            prompt: body,
            source: filePath
        };
    } catch (error) {
        console.error(`Failed to parse agent file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Parse a skill SKILL.md file
 */
async function parseSkillFile(filePath) {
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
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    meta[key] = value;
                }
            }
        }

        return {
            name: meta.name || path.basename(path.dirname(filePath)),
            description: meta.description || '',
            version: meta.version || '1.0.0',
            content: body,
            source: filePath
        };
    } catch (error) {
        console.error(`Failed to parse skill file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Replace ${PLUGIN_ROOT} placeholders with actual path
 */
function replacePluginRoot(obj, rootPath) {
    if (typeof obj === 'string') {
        return obj.replace(/\$\{PLUGIN_ROOT\}/g, rootPath);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => replacePluginRoot(item, rootPath));
    }
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = replacePluginRoot(value, rootPath);
        }
        return result;
    }
    return obj;
}

/**
 * Get a loaded plugin by name
 */
export function getPlugin(name) {
    return PLUGINS.get(name);
}

/**
 * Get all loaded plugins
 */
export function getAllPlugins() {
    return Array.from(PLUGINS.values());
}

/**
 * Get all loaded agents across all plugins
 */
export function getAllAgents() {
    const agents = [];
    for (const plugin of PLUGINS.values()) {
        if (plugin.enabled) {
            agents.push(...plugin.agents);
        }
    }
    return agents;
}

/**
 * Get all loaded skills across all plugins
 */
export function getAllSkills() {
    const skills = [];
    for (const plugin of PLUGINS.values()) {
        if (plugin.enabled) {
            skills.push(...plugin.skills);
        }
    }
    return skills;
}

/**
 * Get all hooks across all plugins
 */
export function getAllHooks() {
    const hooks = {
        PreToolUse: [],
        PostToolUse: [],
        SessionStart: [],
        SessionEnd: [],
        Stop: [],
        UserPromptSubmit: []
    };

    for (const plugin of PLUGINS.values()) {
        if (plugin.enabled && plugin.hooks) {
            for (const [event, eventHooks] of Object.entries(plugin.hooks)) {
                if (hooks[event]) {
                    if (Array.isArray(eventHooks)) {
                        hooks[event].push(...eventHooks.map(h => ({ ...h, plugin: plugin.name })));
                    }
                }
            }
        }
    }

    return hooks;
}

/**
 * Enable a plugin
 */
export function enablePlugin(name) {
    const plugin = PLUGINS.get(name);
    if (plugin) {
        plugin.enabled = true;
        return true;
    }
    return false;
}

/**
 * Disable a plugin
 */
export function disablePlugin(name) {
    const plugin = PLUGINS.get(name);
    if (plugin) {
        plugin.enabled = false;
        return true;
    }
    return false;
}

export default {
    loadPlugins,
    loadPlugin,
    getPlugin,
    getAllPlugins,
    getAllAgents,
    getAllSkills,
    getAllHooks,
    enablePlugin,
    disablePlugin
};
