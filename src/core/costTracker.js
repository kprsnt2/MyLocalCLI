// Cost Tracker - Track API usage costs per session
// Ported from claw-code's cost_tracker.py

export class CostTracker {
    constructor() {
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
        this.totalCost = 0;
        this.events = [];
        this.startTime = Date.now();
    }

    record(label, inputTokens = 0, outputTokens = 0, cost = 0) {
        this.totalInputTokens += inputTokens;
        this.totalOutputTokens += outputTokens;
        this.totalCost += cost;
        this.events.push({
            label,
            inputTokens,
            outputTokens,
            cost,
            timestamp: Date.now()
        });
    }

    get totalTokens() {
        return this.totalInputTokens + this.totalOutputTokens;
    }

    get duration() {
        return ((Date.now() - this.startTime) / 1000).toFixed(1);
    }

    get summary() {
        return {
            totalInputTokens: this.totalInputTokens,
            totalOutputTokens: this.totalOutputTokens,
            totalTokens: this.totalTokens,
            totalCost: this.totalCost,
            eventCount: this.events.length,
            duration: this.duration
        };
    }

    formatSummary() {
        const lines = [
            `Tokens: ${this.totalInputTokens} in / ${this.totalOutputTokens} out (${this.totalTokens} total)`,
            `Cost: $${this.totalCost.toFixed(4)}`,
            `Duration: ${this.duration}s`,
            `API calls: ${this.events.length}`
        ];
        return lines.join('\n');
    }

    formatCompact() {
        return `${this.totalTokens} tokens | $${this.totalCost.toFixed(4)} | ${this.duration}s`;
    }

    reset() {
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
        this.totalCost = 0;
        this.events = [];
        this.startTime = Date.now();
    }
}

// Pricing tables (per 1M tokens)
const PRICING = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
    'gemma2-9b-it': { input: 0.20, output: 0.20 },
    'z-ai/glm5': { input: 0.50, output: 1.00 },
    'meta/llama-3.1-405b-instruct': { input: 5.00, output: 16.00 },
    'meta/llama-3.1-70b-instruct': { input: 0.59, output: 0.79 },
    'nvidia/nemotron-4-340b-instruct': { input: 4.20, output: 4.20 },
};

export function estimateCost(model, inputTokens, outputTokens) {
    const pricing = PRICING[model];
    if (!pricing) return 0;
    return (inputTokens * pricing.input / 1_000_000) + (outputTokens * pricing.output / 1_000_000);
}

export default { CostTracker, estimateCost, PRICING };
