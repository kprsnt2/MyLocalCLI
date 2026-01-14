// MyLocalCLI - Mode System
// Inspired by OpenCode's build/plan agents and AmpCode's smart/rush modes

import chalk from 'chalk';
import { colors } from '../ui/terminal.js';

/**
 * Agent Modes (inspired by OpenCode)
 * - build: Full access mode - can read/write files, run commands
 * - plan: Read-only mode - can only analyze, search, explore
 */
export const AGENT_MODES = {
    build: {
        name: 'build',
        displayName: 'BUILD',
        description: 'Full access - can modify files and run commands',
        icon: '🔨',
        color: chalk.hex('#10B981'), // green
        allowedToolCategories: ['read', 'write', 'execute', 'search', 'git'],
        blockedTools: [] // no restrictions
    },
    plan: {
        name: 'plan',
        displayName: 'PLAN',
        description: 'Read-only - can analyze and explore, no modifications',
        icon: '📋',
        color: chalk.hex('#3B82F6'), // blue
        allowedToolCategories: ['read', 'search'],
        blockedTools: ['write_file', 'edit_file', 'multi_edit_file', 'delete_file',
            'append_file', 'move_file', 'copy_file', 'create_directory',
            'run_command', 'git_commit', 'find_replace', 'insert_at_line']
    }
};

/**
 * Performance Modes (inspired by AmpCode)
 * - smart: Best model, full context, max capability
 * - rush: Faster/cheaper model, reduced context
 */
export const PERFORMANCE_MODES = {
    smart: {
        name: 'smart',
        displayName: 'SMART',
        description: 'Maximum capability - uses best available model',
        icon: '🧠',
        color: chalk.hex('#8B5CF6'), // purple
        maxTokens: 128000,
        temperature: 0.7
    },
    rush: {
        name: 'rush',
        displayName: 'RUSH',
        description: 'Fast and efficient - uses faster model',
        icon: '⚡',
        color: chalk.hex('#F59E0B'), // amber
        maxTokens: 32000,
        temperature: 0.5
    }
};

// Current mode state
let currentAgentMode = 'build';
let currentPerformanceMode = 'smart';

/**
 * Get current agent mode
 */
export function getAgentMode() {
    return AGENT_MODES[currentAgentMode];
}

/**
 * Get current performance mode
 */
export function getPerformanceMode() {
    return PERFORMANCE_MODES[currentPerformanceMode];
}

/**
 * Set agent mode
 */
export function setAgentMode(mode) {
    if (AGENT_MODES[mode]) {
        currentAgentMode = mode;
        return true;
    }
    return false;
}

/**
 * Set performance mode
 */
export function setPerformanceMode(mode) {
    if (PERFORMANCE_MODES[mode]) {
        currentPerformanceMode = mode;
        return true;
    }
    return false;
}

/**
 * Toggle between build and plan modes
 */
export function toggleAgentMode() {
    currentAgentMode = currentAgentMode === 'build' ? 'plan' : 'build';
    return getAgentMode();
}

/**
 * Toggle between smart and rush modes
 */
export function togglePerformanceMode() {
    currentPerformanceMode = currentPerformanceMode === 'smart' ? 'rush' : 'smart';
    return getPerformanceMode();
}

/**
 * Check if a tool is allowed in current mode
 */
export function isToolAllowed(toolName) {
    const mode = getAgentMode();
    return !mode.blockedTools.includes(toolName);
}

/**
 * Get list of allowed tools for current mode
 */
export function getAllowedTools(allTools) {
    const mode = getAgentMode();
    return allTools.filter(tool => !mode.blockedTools.includes(tool.name || tool));
}

/**
 * Format mode indicator for display
 */
export function formatModeIndicator() {
    const agentMode = getAgentMode();
    const perfMode = getPerformanceMode();

    return `${agentMode.color(`[${agentMode.displayName}]`)} ${perfMode.color(`[${perfMode.displayName}]`)}`;
}

/**
 * Print mode status
 */
export function printModeStatus() {
    const agentMode = getAgentMode();
    const perfMode = getPerformanceMode();

    console.log(`\n${colors.primary('━━━ Current Modes ━━━')}\n`);
    console.log(`  ${agentMode.icon} Agent Mode: ${agentMode.color(agentMode.displayName)}`);
    console.log(`    ${colors.muted(agentMode.description)}`);
    console.log();
    console.log(`  ${perfMode.icon} Performance: ${perfMode.color(perfMode.displayName)}`);
    console.log(`    ${colors.muted(perfMode.description)}`);
    console.log();
    console.log(colors.muted('  Press Tab to switch agent mode'));
    console.log(colors.muted('  Use /mode <name> to switch modes'));
    console.log();
}

/**
 * Get mode switch message
 */
export function getModeSwitchMessage(mode) {
    const modeObj = AGENT_MODES[mode] || PERFORMANCE_MODES[mode];
    if (!modeObj) return null;

    return `${modeObj.icon} Switched to ${modeObj.color(modeObj.displayName)} mode - ${modeObj.description}`;
}

export default {
    AGENT_MODES,
    PERFORMANCE_MODES,
    getAgentMode,
    getPerformanceMode,
    setAgentMode,
    setPerformanceMode,
    toggleAgentMode,
    togglePerformanceMode,
    isToolAllowed,
    getAllowedTools,
    formatModeIndicator,
    printModeStatus,
    getModeSwitchMessage
};
