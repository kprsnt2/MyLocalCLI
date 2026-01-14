// MyLocalCLI - Command Palette
// Inspired by AmpCode's command palette (Ctrl+O)

import readline from 'readline';
import { colors } from './terminal.js';
import { getAllCommands } from '../core/commands.js';
import {
    getAgentMode,
    getPerformanceMode,
    toggleAgentMode,
    togglePerformanceMode,
    AGENT_MODES,
    PERFORMANCE_MODES,
    getModeSwitchMessage
} from '../core/modes.js';

/**
 * Fuzzy match a query against text
 */
function fuzzyMatch(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();

    if (text.includes(query)) return true;

    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (text[i] === query[queryIndex]) {
            queryIndex++;
        }
    }
    return queryIndex === query.length;
}

/**
 * Get palette items including commands and mode switches
 */
function getPaletteItems() {
    const items = [];

    // Mode switches
    items.push({
        type: 'mode',
        name: 'Switch to BUILD mode',
        shortcut: 'Tab',
        description: 'Full access - modify files and run commands',
        icon: '🔨',
        action: () => {
            if (getAgentMode().name !== 'build') {
                toggleAgentMode();
                return getModeSwitchMessage('build');
            }
            return 'Already in BUILD mode';
        }
    });

    items.push({
        type: 'mode',
        name: 'Switch to PLAN mode',
        shortcut: 'Tab',
        description: 'Read-only - analyze and explore only',
        icon: '📋',
        action: () => {
            if (getAgentMode().name !== 'plan') {
                toggleAgentMode();
                return getModeSwitchMessage('plan');
            }
            return 'Already in PLAN mode';
        }
    });

    items.push({
        type: 'mode',
        name: 'Switch to SMART mode',
        description: 'Maximum capability with best model',
        icon: '🧠',
        action: () => {
            if (getPerformanceMode().name !== 'smart') {
                togglePerformanceMode();
                return getModeSwitchMessage('smart');
            }
            return 'Already in SMART mode';
        }
    });

    items.push({
        type: 'mode',
        name: 'Switch to RUSH mode',
        description: 'Fast and efficient responses',
        icon: '⚡',
        action: () => {
            if (getPerformanceMode().name !== 'rush') {
                togglePerformanceMode();
                return getModeSwitchMessage('rush');
            }
            return 'Already in RUSH mode';
        }
    });

    // Separator
    items.push({ type: 'separator', name: '─── Commands ───' });

    // Commands from registry
    const commands = getAllCommands();
    for (const cmd of commands) {
        items.push({
            type: 'command',
            name: `/${cmd.name}`,
            description: cmd.description,
            icon: '›',
            command: `/${cmd.name}`
        });
    }

    return items;
}

/**
 * Render the palette UI
 */
function renderPalette(items, selectedIndex, query) {
    // Clear screen area for palette
    process.stdout.write('\x1B[2J\x1B[0;0H'); // Clear screen and move to top

    const width = Math.min(process.stdout.columns || 80, 60);
    const border = '─'.repeat(width - 2);

    console.log(colors.primary(`╭${border}╮`));
    console.log(colors.primary(`│`) + ' '.repeat(width - 2) + colors.primary(`│`));

    // Search input
    const searchLine = `  🔍 ${query || 'Type to search...'}`;
    const padding = width - 2 - searchLine.length;
    console.log(colors.primary(`│`) + (query ? colors.secondary(searchLine) : colors.muted(searchLine)) + ' '.repeat(Math.max(0, padding)) + colors.primary(`│`));

    console.log(colors.primary(`├${border}┤`));

    // Filter items
    const filteredItems = query
        ? items.filter(item => item.type !== 'separator' && fuzzyMatch(query, item.name))
        : items;

    // Show items (max 10)
    const visibleItems = filteredItems.slice(0, 10);

    for (let i = 0; i < visibleItems.length; i++) {
        const item = visibleItems[i];
        const isSelected = i === selectedIndex;

        if (item.type === 'separator') {
            console.log(colors.primary(`│`) + colors.muted(`  ${item.name}`) + ' '.repeat(Math.max(0, width - 4 - item.name.length)) + colors.primary(`│`));
        } else {
            const prefix = isSelected ? colors.success('▶ ') : '  ';
            const icon = item.icon || ' ';
            const name = isSelected ? colors.primary(item.name) : item.name;
            const shortcut = item.shortcut ? colors.muted(` [${item.shortcut}]`) : '';

            const line = `${prefix}${icon} ${name}${shortcut}`;
            // Estimate visible length (rough)
            const visibleLen = item.name.length + 4 + (item.shortcut ? item.shortcut.length + 3 : 0);
            const linePadding = Math.max(0, width - 2 - visibleLen);

            console.log(colors.primary(`│`) + line + ' '.repeat(linePadding) + colors.primary(`│`));

            if (item.description && isSelected) {
                const desc = colors.muted(`    ${item.description.slice(0, width - 8)}`);
                console.log(colors.primary(`│`) + desc + ' '.repeat(Math.max(0, width - 6 - item.description.length)) + colors.primary(`│`));
            }
        }
    }

    if (filteredItems.length === 0) {
        console.log(colors.primary(`│`) + colors.muted('  No matching commands') + ' '.repeat(width - 24) + colors.primary(`│`));
    }

    console.log(colors.primary(`│`) + ' '.repeat(width - 2) + colors.primary(`│`));
    console.log(colors.primary(`╰${border}╯`));
    console.log(colors.muted('  ↑↓ Navigate • Enter Select • Esc Close'));
}

/**
 * Show the command palette
 * @returns {Promise<{action?: Function, command?: string, cancelled: boolean}>}
 */
export function showCommandPalette() {
    return new Promise((resolve) => {
        const items = getPaletteItems();
        let selectedIndex = 0;
        let query = '';
        let filteredItems = items;

        // Set raw mode to capture individual keystrokes
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        const updateFilter = () => {
            filteredItems = query
                ? items.filter(item => item.type !== 'separator' && fuzzyMatch(query, item.name))
                : items;
            selectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1));
        };

        const cleanup = () => {
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }
            process.stdin.removeListener('data', onData);
            // Clear palette area
            process.stdout.write('\x1B[2J\x1B[0;0H');
        };

        const onData = (key) => {
            const keyStr = key.toString();

            // Escape - cancel
            if (keyStr === '\x1B' || keyStr === '\x03') { // Escape or Ctrl+C
                cleanup();
                resolve({ cancelled: true });
                return;
            }

            // Enter - select
            if (keyStr === '\r' || keyStr === '\n') {
                cleanup();
                const selected = filteredItems[selectedIndex];
                if (selected && selected.type !== 'separator') {
                    resolve({
                        cancelled: false,
                        action: selected.action,
                        command: selected.command
                    });
                } else {
                    resolve({ cancelled: true });
                }
                return;
            }

            // Arrow keys
            if (keyStr === '\x1B[A') { // Up
                selectedIndex = Math.max(0, selectedIndex - 1);
                // Skip separators
                while (filteredItems[selectedIndex]?.type === 'separator' && selectedIndex > 0) {
                    selectedIndex--;
                }
            } else if (keyStr === '\x1B[B') { // Down
                selectedIndex = Math.min(filteredItems.length - 1, selectedIndex + 1);
                // Skip separators
                while (filteredItems[selectedIndex]?.type === 'separator' && selectedIndex < filteredItems.length - 1) {
                    selectedIndex++;
                }
            }
            // Backspace
            else if (keyStr === '\x7F' || keyStr === '\b') {
                query = query.slice(0, -1);
                updateFilter();
            }
            // Regular character
            else if (keyStr.length === 1 && keyStr.charCodeAt(0) >= 32) {
                query += keyStr;
                updateFilter();
            }

            renderPalette(items, selectedIndex, query);
        };

        process.stdin.on('data', onData);

        // Initial render
        renderPalette(items, selectedIndex, query);
    });
}

export default {
    showCommandPalette,
    fuzzyMatch
};
