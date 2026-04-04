import { getAgentMode, getPerformanceMode } from './modes.js';

class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this._registerBuiltInCommands();
    }

    _registerBuiltInCommands() {
        this.register('help', ['?', 'h'], 'Show command help', (context) => {
            const cmdList = Array.from(this.commands.values())
               .map(c => `- \`/${c.defaultName}\` ${c.aliases.length > 0 ? `(or /${c.aliases.join(', /')})` : ''} - ${c.description}`)
               .join('\n');

            context.messages.push({
                role: 'assistant',
                content: `# MyLocalCLI Commands\n\n## Available Commands\n${cmdList}\n\n## Modes\n- \`tab\` - Toggle BUILD/PLAN mode\n\n## Shell\n- \`$ <cmd>\` - Run shell command\n- \`$$ <cmd>\` - Run without AI seeing output`
            });
            return { action: 'drawChat' };
        });

        this.register('clear', ['new'], 'Start new conversation', (context) => {
            return { action: 'clearChat' };
        });

        this.register('exit', ['quit', 'q'], 'Exit application', (context) => {
            return { action: 'exit' };
        });

        this.register('mode', [], 'Show current mode', (context) => {
            const mode = getAgentMode();
            const perfMode = getPerformanceMode();
            context.messages.push({
                role: 'assistant',
                content: `**Current Modes**\n\n- Agent: ${mode.displayName} ${mode.name === 'build' ? '🔨' : '📋'}\n- Performance: ${perfMode.displayName} ${perfMode.name === 'smart' ? '🧠' : '⚡'}`
            });
            return { action: 'drawChat' };
        });
    }

    register(name, aliases, description, handler) {
        const cmdObj = { defaultName: name, aliases, description, handler };
        this.commands.set(name, cmdObj);
        aliases.forEach(alias => this.commands.set(alias, cmdObj));
    }

    async execute(rawCmd, context) {
        const fullCmd = rawCmd.trim().toLowerCase().substring(1); // remove '/'
        const parts = fullCmd.split(' ');
        const mainCmd = parts[0];

        if (this.commands.has(mainCmd)) {
            return await this.commands.get(mainCmd).handler(context, parts.slice(1));
        }

        context.messages.push({
            role: 'assistant',
            content: `Unknown command: \`/${mainCmd}\`. Type \`/help\` to see available commands.`
        });
        return { action: 'drawChat' };
    }
}

export const commandRegistry = new CommandRegistry();
