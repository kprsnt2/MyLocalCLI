// History Event Log - Structured event logging for sessions
// Ported from claw-code's history.py

export class HistoryEvent {
    constructor(title, detail) {
        this.title = title;
        this.detail = detail;
        this.timestamp = Date.now();
    }
}

export class HistoryLog {
    constructor() {
        this.events = [];
    }

    add(title, detail) {
        this.events.push(new HistoryEvent(title, detail));
    }

    get length() {
        return this.events.length;
    }

    get last() {
        return this.events[this.events.length - 1] || null;
    }

    getByTitle(title) {
        return this.events.filter(e => e.title === title);
    }

    getRecent(count = 10) {
        return this.events.slice(-count);
    }

    formatMarkdown() {
        const lines = ['# Session History', ''];
        for (const event of this.events) {
            const time = new Date(event.timestamp).toLocaleTimeString();
            lines.push(`- [${time}] ${event.title}: ${event.detail}`);
        }
        return lines.join('\n');
    }

    formatCompact() {
        return this.events
            .map(e => `${e.title}: ${e.detail}`)
            .join('\n');
    }

    toJSON() {
        return this.events.map(e => ({
            title: e.title,
            detail: e.detail,
            timestamp: e.timestamp
        }));
    }

    static fromJSON(data) {
        const log = new HistoryLog();
        for (const item of data) {
            const event = new HistoryEvent(item.title, item.detail);
            event.timestamp = item.timestamp;
            log.events.push(event);
        }
        return log;
    }

    clear() {
        this.events = [];
    }
}

export default { HistoryEvent, HistoryLog };
