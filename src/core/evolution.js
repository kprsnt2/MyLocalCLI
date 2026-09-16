// MyLocalCLI - Self-Learning & Evolution Engine
// Inspired by Hermes Agent (memory/skill synthesis) and oh-my-pi (learn/retain/reflect)

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class EvolutionEngine {
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
        this.localMlcDir = path.join(cwd, '.mlc');
        this.globalMlcDir = path.join(os.homedir(), '.mylocalcli');
        this.memoryFile = path.join(this.localMlcDir, 'memory.json');
        this.skillsDir = path.join(this.localMlcDir, 'skills');
    }

    /**
     * Ensure storage directories exist.
     */
    async ensureStorage() {
        try {
            await fs.mkdir(this.localMlcDir, { recursive: true });
            await fs.mkdir(this.skillsDir, { recursive: true });
        } catch {
            // Ignore if already exists
        }
    }

    /**
     * Load project memory (invariants, lessons learned, conventions).
     */
    async loadMemory() {
        await this.ensureStorage();
        try {
            const data = await fs.readFile(this.memoryFile, 'utf-8');
            return JSON.parse(data);
        } catch {
            return {
                invariants: [],
                lessonsLearned: [],
                conventions: {},
                lastUpdated: null
            };
        }
    }

    /**
     * Save updated memory.
     */
    async saveMemory(memory) {
        await this.ensureStorage();
        memory.lastUpdated = new Date().toISOString();
        await fs.writeFile(this.memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
        return memory;
    }

    /**
     * Learn a new invariant or rule (e.g. "Always run build with --release", "Port 8080 is reserved").
     */
    async recordInvariant(rule, category = 'general') {
        const mem = await this.loadMemory();
        if (!mem.invariants.some(i => i.rule === rule)) {
            mem.invariants.push({
                rule,
                category,
                recordedAt: new Date().toISOString()
            });
            await this.saveMemory(mem);
        }
        return { success: true, count: mem.invariants.length };
    }

    /**
     * Record a reflection or lesson learned after fixing a bug or overcoming a failure.
     */
    async recordReflection({ mistake, cause, solution, rule }) {
        const mem = await this.loadMemory();
        mem.lessonsLearned.push({
            mistake,
            cause,
            solution,
            rule,
            timestamp: new Date().toISOString()
        });
        if (rule && !mem.invariants.some(i => i.rule === rule)) {
            mem.invariants.push({
                rule,
                category: 'error-recovery',
                recordedAt: new Date().toISOString()
            });
        }
        await this.saveMemory(mem);
        return { success: true, message: 'Reflection recorded for future tasks' };
    }

    /**
     * Synthesize and store a new reusable skill.
     *
     * @param {Object} skill
     * @param {string} skill.name - Unique skill name (e.g., "rust-cross-compile")
     * @param {string} skill.description - What the skill does
     * @param {string} skill.instructions - Step-by-step instructions or patterns
     * @param {string[]} skill.triggers - Keywords that trigger this skill
     */
    async learnSkill({ name, description, instructions, triggers = [] }) {
        await this.ensureStorage();
        const safeName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const skillPath = path.join(this.skillsDir, `${safeName}.md`);

        const skillContent = `---
name: ${safeName}
description: ${description}
triggers: ${triggers.join(', ')}
learned_at: ${new Date().toISOString()}
---

# ${name}

${description}

## Instructions & Patterns
${instructions}
`;

        await fs.writeFile(skillPath, skillContent, 'utf-8');
        return {
            success: true,
            path: skillPath,
            name: safeName
        };
    }

    /**
     * Format memory and learned rules as context for system prompt injection.
     */
    async formatContextForPrompt(userQuery = '') {
        const mem = await this.loadMemory();
        let promptSection = '';

        if (mem.invariants.length > 0) {
            promptSection += '\n\n## 🧠 LEARNED MEMORY & PROJECT INVARIANTS (Self-Evolved)\n';
            promptSection += 'You have previously learned the following rules and invariants for this project. DO NOT violate them:\n';
            mem.invariants.slice(-10).forEach((inv, idx) => {
                promptSection += `${idx + 1}. [${inv.category}] ${inv.rule}\n`;
            });
        }

        if (mem.lessonsLearned.length > 0) {
            promptSection += '\n## 🛡️ LESSONS LEARNED FROM PAST MISTAKES:\n';
            mem.lessonsLearned.slice(-5).forEach((lesson, idx) => {
                promptSection += `${idx + 1}. Mistake: ${lesson.mistake}\n   Fix: ${lesson.solution}\n`;
            });
        }

        return promptSection;
    }
}

export default EvolutionEngine;
