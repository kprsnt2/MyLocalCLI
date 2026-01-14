// MyLocalCLI - Session Branching System
// Create conversation branches for exploring alternatives

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { printSuccess, printError, printInfo, printWarning, colors } from '../ui/terminal.js';

const BRANCHES_DIR = path.join(os.homedir(), '.mylocalcli', 'branches');

/**
 * Branch state
 */
let currentBranch = 'main';
const branches = new Map();

/**
 * Create a new branch from current conversation
 */
export async function createBranch(name, messages, sessionId) {
    const branchId = `${sessionId}-${name}`;
    const branchPath = path.join(BRANCHES_DIR, `${branchId}.json`);

    await fs.mkdir(BRANCHES_DIR, { recursive: true });

    const branchData = {
        id: branchId,
        name,
        parentSession: sessionId,
        createdAt: new Date().toISOString(),
        messages: [...messages] // Clone current messages
    };

    await fs.writeFile(branchPath, JSON.stringify(branchData, null, 2));
    branches.set(name, branchData);

    return branchData;
}

/**
 * List all branches for a session
 */
export async function listBranches(sessionId) {
    try {
        await fs.mkdir(BRANCHES_DIR, { recursive: true });
        const files = await fs.readdir(BRANCHES_DIR);
        const sessionBranches = [];

        for (const file of files) {
            if (file.startsWith(sessionId) && file.endsWith('.json')) {
                const content = await fs.readFile(path.join(BRANCHES_DIR, file), 'utf-8');
                const branch = JSON.parse(content);
                sessionBranches.push(branch);
                branches.set(branch.name, branch);
            }
        }

        return sessionBranches;
    } catch (error) {
        return [];
    }
}

/**
 * Load a branch
 */
export async function loadBranch(name, sessionId) {
    const branchId = `${sessionId}-${name}`;
    const branchPath = path.join(BRANCHES_DIR, `${branchId}.json`);

    try {
        const content = await fs.readFile(branchPath, 'utf-8');
        const branch = JSON.parse(content);
        currentBranch = name;
        return branch;
    } catch (error) {
        return null;
    }
}

/**
 * Get current branch name
 */
export function getCurrentBranch() {
    return currentBranch;
}

/**
 * Set current branch
 */
export function setCurrentBranch(name) {
    currentBranch = name;
}

/**
 * Print branches list
 */
export async function printBranchesList(sessionId) {
    const branchList = await listBranches(sessionId);

    console.log(`\n${colors.primary('━━━ Conversation Branches ━━━')}\n`);

    console.log(`  ${currentBranch === 'main' ? colors.success('●') : '○'} ${colors.primary('main')} ${currentBranch === 'main' ? colors.muted('(current)') : ''}`);

    if (branchList.length === 0) {
        console.log(colors.muted('\n  No branches created yet.'));
    } else {
        for (const branch of branchList) {
            const isCurrent = currentBranch === branch.name;
            const marker = isCurrent ? colors.success('●') : '○';
            const name = isCurrent ? colors.primary(branch.name) : branch.name;
            const msgCount = colors.muted(`(${branch.messages?.length || 0} msgs)`);
            console.log(`  ${marker} ${name} ${msgCount} ${isCurrent ? colors.muted('(current)') : ''}`);
        }
    }

    console.log();
    console.log(colors.muted('  Use /branch <name> to create a new branch'));
    console.log(colors.muted('  Use /checkout <name> to switch to a branch'));
    console.log();
}

export default {
    createBranch,
    listBranches,
    loadBranch,
    getCurrentBranch,
    setCurrentBranch,
    printBranchesList
};
