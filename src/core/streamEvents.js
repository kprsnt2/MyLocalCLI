// Stream Events Protocol - Event-based message streaming
// Ported from claw-code's query_engine.py stream_submit_message

export const EVENT_TYPES = {
    MESSAGE_START: 'message_start',
    COMMAND_MATCH: 'command_match',
    TOOL_MATCH: 'tool_match',
    TOOL_USE: 'tool_use',
    TOOL_RESULT: 'tool_result',
    PERMISSION_DENIAL: 'permission_denial',
    MESSAGE_DELTA: 'message_delta',
    MESSAGE_STOP: 'message_stop',
    ERROR: 'error',
    COST_UPDATE: 'cost_update'
};

export class StreamEvent {
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
        this.timestamp = Date.now();
    }

    toJSON() {
        return {
            type: this.type,
            data: this.data,
            timestamp: this.timestamp
        };
    }
}

export class StreamEventEmitter {
    constructor() {
        this.listeners = new Map();
        this.eventLog = [];
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    off(eventType, callback) {
        const cbs = this.listeners.get(eventType);
        if (cbs) {
            this.listeners.set(eventType, cbs.filter(cb => cb !== callback));
        }
    }

    emit(eventType, data = {}) {
        const event = new StreamEvent(eventType, data);
        this.eventLog.push(event);

        const cbs = this.listeners.get(eventType) || [];
        for (const cb of cbs) {
            try { cb(event); } catch { /* don't break the chain */ }
        }

        // Also emit to wildcard listeners
        const wildcardCbs = this.listeners.get('*') || [];
        for (const cb of wildcardCbs) {
            try { cb(event); } catch { /* don't break the chain */ }
        }

        return event;
    }

    emitMessageStart(sessionId, prompt) {
        return this.emit(EVENT_TYPES.MESSAGE_START, { sessionId, prompt });
    }

    emitCommandMatch(commands) {
        return this.emit(EVENT_TYPES.COMMAND_MATCH, { commands });
    }

    emitToolMatch(tools) {
        return this.emit(EVENT_TYPES.TOOL_MATCH, { tools });
    }

    emitToolUse(toolName, input) {
        return this.emit(EVENT_TYPES.TOOL_USE, { toolName, input });
    }

    emitToolResult(toolName, result) {
        return this.emit(EVENT_TYPES.TOOL_RESULT, { toolName, result });
    }

    emitPermissionDenial(toolName, reason) {
        return this.emit(EVENT_TYPES.PERMISSION_DENIAL, { toolName, reason });
    }

    emitMessageDelta(text) {
        return this.emit(EVENT_TYPES.MESSAGE_DELTA, { text });
    }

    emitMessageStop(usage, stopReason) {
        return this.emit(EVENT_TYPES.MESSAGE_STOP, { usage, stopReason });
    }

    emitCostUpdate(cost) {
        return this.emit(EVENT_TYPES.COST_UPDATE, { cost });
    }

    emitError(error) {
        return this.emit(EVENT_TYPES.ERROR, {
            message: error.message || String(error),
            stack: error.stack
        });
    }

    getLog() {
        return [...this.eventLog];
    }

    clearLog() {
        this.eventLog = [];
    }
}

// Singleton
let emitterInstance = null;

export function getStreamEmitter() {
    if (!emitterInstance) {
        emitterInstance = new StreamEventEmitter();
    }
    return emitterInstance;
}

export default { EVENT_TYPES, StreamEvent, StreamEventEmitter, getStreamEmitter };
