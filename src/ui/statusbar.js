// MyLocalCLI - Status Bar
// Persistent status display for mode, provider, and usage info

import chalk from 'chalk';
import { colors } from './terminal.js';
import { getAgentMode, getPerformanceMode, formatModeIndicator } from '../core/modes.js';

/**
 * Format token count with color coding
 */
function formatTokens(used, max) {
    const percentage = Math.round((used / max) * 100);
    let color = chalk.green;
    if (percentage > 80) color = chalk.red;
    else if (percentage > 50) color = chalk.yellow;

    return color(`${used.toLocaleString()}/${max.toLocaleString()}`);
}

/**
 * Render status bar
 */
export function renderStatusBar(options = {}) {
    const {
        provider = 'unknown',
        model = 'unknown',
        tokens = 0,
        maxTokens = 128000,
        messageCount = 0
    } = options;

    const agentMode = getAgentMode();
    const perfMode = getPerformanceMode();

    const width = process.stdout.columns || 80;
    const line = '─'.repeat(width);

    // Build status components
    const modeIndicator = `${agentMode.icon} ${agentMode.color(agentMode.displayName)}`;
    const perfIndicator = `${perfMode.icon} ${perfMode.color(perfMode.displayName)}`;
    const providerInfo = colors.muted(`${provider}/${model}`);
    const tokenInfo = colors.muted(`📊 ${formatTokens(tokens, maxTokens)} tokens`);
    const msgInfo = colors.muted(`💬 ${messageCount} msgs`);
    const shortcutHint = colors.muted('Tab:mode • Ctrl+O:palette • /help');

    console.log(colors.muted(line));
    console.log(`  ${modeIndicator}  ${perfIndicator}  │  ${providerInfo}  │  ${tokenInfo}  │  ${msgInfo}`);
    console.log(`  ${shortcutHint}`);
    console.log(colors.muted(line));
}

/**
 * Render compact inline status (for prompts)
 */
export function getInlineStatus() {
    const agentMode = getAgentMode();
    const perfMode = getPerformanceMode();

    return `${agentMode.color(`[${agentMode.displayName}]`)}`;
}

/**
 * Render mode switch notification
 */
export function renderModeSwitchNotification(modeName, modeType = 'agent') {
    const modes = modeType === 'agent'
        ? { build: '🔨 BUILD', plan: '📋 PLAN' }
        : { smart: '🧠 SMART', rush: '⚡ RUSH' };

    const display = modes[modeName] || modeName;
    const width = process.stdout.columns || 80;
    const padding = Math.floor((width - display.length - 20) / 2);

    console.log();
    console.log(' '.repeat(Math.max(0, padding)) + colors.primary(`╭${'─'.repeat(display.length + 18)}╮`));
    console.log(' '.repeat(Math.max(0, padding)) + colors.primary(`│  Switched to ${display} mode  │`));
    console.log(' '.repeat(Math.max(0, padding)) + colors.primary(`╰${'─'.repeat(display.length + 18)}╯`));
    console.log();
}

/**
 * Show keyboard shortcuts help overlay
 */
export function showKeyboardShortcuts() {
    console.log(`
${colors.primary('━━━ Keyboard Shortcuts ━━━')}

  ${colors.secondary('Tab')}          Switch between BUILD/PLAN modes
  ${colors.secondary('Ctrl+O')}       Open command palette
  ${colors.secondary('Ctrl+C')}       Cancel current operation / Exit
  ${colors.secondary('↑/↓')}          Navigate input history
  ${colors.secondary('Tab')}          Auto-complete commands

${colors.primary('━━━ Shell Mode ━━━')}

  ${colors.secondary('$ <cmd>')}      Run shell command (output in context)
  ${colors.secondary('$$ <cmd>')}     Run shell command (incognito - not in context)

${colors.primary('━━━ Quick Commands ━━━')}

  ${colors.secondary('/help')}        Show all commands
  ${colors.secondary('/mode')}        Switch modes
  ${colors.secondary('/agents')}      List available agents
  ${colors.secondary('/tools')}       List available tools
`);
}

export default {
    renderStatusBar,
    getInlineStatus,
    renderModeSwitchNotification,
    showKeyboardShortcuts
};
