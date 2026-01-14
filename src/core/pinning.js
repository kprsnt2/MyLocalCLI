// MyLocalCLI - Context Pinning System
// Pin files to always include them in AI context

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { printSuccess, printError, printInfo, printWarning, colors } from '../ui/terminal.js';

// Pinned files storage (in-memory for session, persisted to file)
let pinnedFiles = new Set();
const PINS_FILE = path.join(os.homedir(), '.mylocalcli', 'pinned.json');

/**
 * Load pinned files from disk
 */
export async function loadPinnedFiles() {
    try {
        const data = await fs.readFile(PINS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        pinnedFiles = new Set(parsed.files || []);
    } catch (error) {
        pinnedFiles = new Set();
    }
}

/**
 * Save pinned files to disk
 */
export async function savePinnedFiles() {
    try {
        await fs.mkdir(path.dirname(PINS_FILE), { recursive: true });
        await fs.writeFile(PINS_FILE, JSON.stringify({
            files: Array.from(pinnedFiles),
            updated: new Date().toISOString()
        }, null, 2));
    } catch (error) {
        // Silently fail
    }
}

/**
 * Pin a file to always include in context
 */
export function pinFile(filePath) {
    const normalized = path.normalize(filePath);
    pinnedFiles.add(normalized);
    savePinnedFiles();
    return true;
}

/**
 * Unpin a file
 */
export function unpinFile(filePath) {
    const normalized = path.normalize(filePath);
    const deleted = pinnedFiles.delete(normalized);
    if (deleted) savePinnedFiles();
    return deleted;
}

/**
 * Get all pinned files
 */
export function getPinnedFiles() {
    return Array.from(pinnedFiles);
}

/**
 * Clear all pinned files
 */
export function clearPinnedFiles() {
    pinnedFiles.clear();
    savePinnedFiles();
}

/**
 * Get pinned files content for context injection
 */
export async function getPinnedContext(cwd) {
    const files = getPinnedFiles();
    if (files.length === 0) return '';

    let context = '\n\n--- PINNED FILES (Always in Context) ---\n';

    for (const file of files) {
        const fullPath = path.isAbsolute(file) ? file : path.join(cwd, file);
        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const ext = path.extname(file).slice(1) || 'txt';
            context += `\n### 📌 ${file}\n\`\`\`${ext}\n${content.slice(0, 3000)}\n\`\`\`\n`;
        } catch (error) {
            context += `\n### 📌 ${file}\n(File not found or unreadable)\n`;
        }
    }

    return context;
}

/**
 * Print pinned files list
 */
export function printPinnedFiles() {
    const files = getPinnedFiles();

    console.log(`\n${colors.primary('━━━ Pinned Files ━━━')}\n`);

    if (files.length === 0) {
        console.log(colors.muted('  No files pinned.'));
        console.log(colors.muted('  Use /pin <file> to pin a file to always include in context.'));
    } else {
        for (const file of files) {
            console.log(`  📌 ${colors.secondary(file)}`);
        }
        console.log();
        console.log(colors.muted(`  ${files.length} file(s) always included in AI context.`));
    }
    console.log();
}

// Load on module init
loadPinnedFiles();

export default {
    loadPinnedFiles,
    savePinnedFiles,
    pinFile,
    unpinFile,
    getPinnedFiles,
    clearPinnedFiles,
    getPinnedContext,
    printPinnedFiles
};
