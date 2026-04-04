// Execution Registry - Centralized command/tool execution tracking
// Ported from claw-code's execution_registry.py

export class ExecutionEntry {
    constructor({ name, kind, sourceHint, timestamp = Date.now() }) {
        this.name = name;
        this.kind = kind;
        this.sourceHint = sourceHint;
        this.timestamp = timestamp;
        this.executionCount = 0;
        this.lastResult = null;
    }

    recordExecution(result) {
        this.executionCount++;
        this.lastResult = result;
        this.timestamp = Date.now();
    }
}

export class ExecutionRegistry {
    constructor() {
        this.commands = new Map();
        this.tools = new Map();
        this.executionLog = [];
    }

    registerCommand(name, sourceHint = '') {
        const entry = new ExecutionEntry({ name, kind: 'command', sourceHint });
        this.commands.set(name.toLowerCase(), entry);
        return entry;
    }

    registerTool(name, sourceHint = '') {
        const entry = new ExecutionEntry({ name, kind: 'tool', sourceHint });
        this.tools.set(name.toLowerCase(), entry);
        return entry;
    }

    getCommand(name) {
        return this.commands.get(name.toLowerCase()) || null;
    }

    getTool(name) {
        return this.tools.get(name.toLowerCase()) || null;
    }

    recordCommandExecution(name, result) {
        const entry = this.getCommand(name);
        if (entry) {
            entry.recordExecution(result);
            this.executionLog.push({
                kind: 'command',
                name,
                result: typeof result === 'string' ? result : JSON.stringify(result),
                timestamp: Date.now()
            });
        }
    }

    recordToolExecution(name, result) {
        const entry = this.getTool(name);
        if (entry) {
            entry.recordExecution(result);
            this.executionLog.push({
                kind: 'tool',
                name,
                result: typeof result === 'string' ? result : JSON.stringify(result),
                timestamp: Date.now()
            });
        }
    }

    get commandCount() {
        return this.commands.size;
    }

    get toolCount() {
        return this.tools.size;
    }

    get totalExecutions() {
        return this.executionLog.length;
    }

    getRecentExecutions(limit = 10) {
        return this.executionLog.slice(-limit);
    }

    formatSummary() {
        const lines = [
            `Commands: ${this.commandCount}`,
            `Tools: ${this.toolCount}`,
            `Total executions: ${this.totalExecutions}`
        ];
        const recent = this.getRecentExecutions(5);
        if (recent.length > 0) {
            lines.push('', 'Recent:');
            for (const exec of recent) {
                lines.push(`  [${exec.kind}] ${exec.name}`);
            }
        }
        return lines.join('\n');
    }

    reset() {
        this.commands.clear();
        this.tools.clear();
        this.executionLog = [];
    }
}

// Singleton instance
let registryInstance = null;

export function getRegistry() {
    if (!registryInstance) {
        registryInstance = new ExecutionRegistry();
    }
    return registryInstance;
}

export function resetRegistry() {
    registryInstance = null;
}

export default { ExecutionRegistry, ExecutionEntry, getRegistry, resetRegistry };
