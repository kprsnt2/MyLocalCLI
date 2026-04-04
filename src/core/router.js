// Prompt Router - Smart routing of prompts to commands/tools
// Ported from claw-code's runtime.py routing logic

import { TOOLS } from './tools.js';
import { getAllCommands } from './commands.js';

export class RoutedMatch {
    constructor({ kind, name, sourceHint, score }) {
        this.kind = kind;
        this.name = name;
        this.sourceHint = sourceHint;
        this.score = score;
    }
}

export class PromptRouter {
    constructor({ tools = null, commands = null } = {}) {
        this.tools = tools || TOOLS;
        this.commands = commands || [];
    }

    routePrompt(prompt, limit = 5) {
        const tokens = new Set(
            prompt.toLowerCase()
                .replace(/[\/\-_\.]/g, ' ')
                .split(/\s+/)
                .filter(t => t.length > 1)
        );

        const commandMatches = this._collectCommandMatches(tokens);
        const toolMatches = this._collectToolMatches(tokens);

        // Select at least one from each category if available
        const selected = [];
        if (commandMatches.length > 0) selected.push(commandMatches.shift());
        if (toolMatches.length > 0) selected.push(toolMatches.shift());

        // Fill remaining slots from combined leftovers
        const leftovers = [...commandMatches, ...toolMatches]
            .sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind));

        selected.push(...leftovers.slice(0, Math.max(0, limit - selected.length)));
        return selected.slice(0, limit);
    }

    suggestTools(prompt) {
        const matches = this.routePrompt(prompt);
        return matches
            .filter(m => m.kind === 'tool')
            .map(m => m.name);
    }

    suggestCommands(prompt) {
        const matches = this.routePrompt(prompt);
        return matches
            .filter(m => m.kind === 'command')
            .map(m => m.name);
    }

    _collectToolMatches(tokens) {
        const matches = [];
        for (const tool of this.tools) {
            const name = tool.function?.name || tool.name || '';
            const description = tool.function?.description || tool.description || '';
            const score = this._score(tokens, name, description);
            if (score > 0) {
                matches.push(new RoutedMatch({
                    kind: 'tool',
                    name,
                    sourceHint: description.slice(0, 60),
                    score
                }));
            }
        }
        return matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    }

    _collectCommandMatches(tokens) {
        const matches = [];
        try {
            const commands = getAllCommands();
            for (const [name, cmd] of commands) {
                const description = cmd.description || '';
                const score = this._score(tokens, name, description);
                if (score > 0) {
                    matches.push(new RoutedMatch({
                        kind: 'command',
                        name: `/${name}`,
                        sourceHint: description.slice(0, 60),
                        score
                    }));
                }
            }
        } catch {
            // commands may not be loaded yet
        }
        return matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    }

    _score(tokens, name, description) {
        const haystacks = [
            name.toLowerCase(),
            description.toLowerCase()
        ];
        let score = 0;
        for (const token of tokens) {
            if (haystacks.some(h => h.includes(token))) {
                score += 1;
            }
        }
        return score;
    }
}

export default { PromptRouter, RoutedMatch };
