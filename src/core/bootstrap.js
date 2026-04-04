// Bootstrap Graph - Startup sequence visualization
// Ported from claw-code's bootstrap_graph.py

export class BootstrapGraph {
    constructor(stages = []) {
        this.stages = stages;
        this.completed = new Set();
        this.startTime = Date.now();
    }

    markCompleted(stage) {
        this.completed.add(stage);
    }

    get progress() {
        if (this.stages.length === 0) return 1;
        return this.completed.size / this.stages.length;
    }

    get isComplete() {
        return this.completed.size >= this.stages.length;
    }

    formatMarkdown() {
        const lines = ['# Bootstrap Graph', ''];
        for (const stage of this.stages) {
            const status = this.completed.has(stage) ? '[x]' : '[ ]';
            lines.push(`- ${status} ${stage}`);
        }
        lines.push('', `Progress: ${Math.round(this.progress * 100)}%`);
        return lines.join('\n');
    }

    formatCompact() {
        const done = this.completed.size;
        const total = this.stages.length;
        return `Bootstrap: ${done}/${total} stages complete (${Math.round(this.progress * 100)}%)`;
    }
}

export function buildBootstrapGraph() {
    return new BootstrapGraph([
        'prefetch workspace metadata',
        'environment guards and platform detection',
        'CLI parser and trust gate',
        'provider config + tool registry load',
        'skills and plugin initialization',
        'permission context application',
        'session store initialization',
        'mode routing: local / web / tui',
        'query engine ready'
    ]);
}

export async function runBootstrap(options = {}) {
    const graph = buildBootstrapGraph();

    // Stage 1: Prefetch
    graph.markCompleted('prefetch workspace metadata');

    // Stage 2: Environment
    graph.markCompleted('environment guards and platform detection');

    // Stage 3: CLI parser
    graph.markCompleted('CLI parser and trust gate');

    // Stage 4: Provider config
    graph.markCompleted('provider config + tool registry load');

    // Stage 5: Skills
    if (options.loadSkills !== false) {
        graph.markCompleted('skills and plugin initialization');
    }

    // Stage 6: Permissions
    graph.markCompleted('permission context application');

    // Stage 7: Session store
    graph.markCompleted('session store initialization');

    // Stage 8: Mode routing
    graph.markCompleted('mode routing: local / web / tui');

    // Stage 9: Query engine
    graph.markCompleted('query engine ready');

    return graph;
}

export default { BootstrapGraph, buildBootstrapGraph, runBootstrap };
