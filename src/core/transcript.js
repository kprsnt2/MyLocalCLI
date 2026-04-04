// Transcript Store - Conversation transcript management with compaction
// Ported from claw-code's transcript.py

export class TranscriptStore {
    constructor({ entries = [], flushed = false } = {}) {
        this.entries = [...entries];
        this.flushed = flushed;
    }

    append(entry) {
        this.entries.push({
            content: entry,
            timestamp: Date.now(),
            role: typeof entry === 'object' ? entry.role : 'unknown'
        });
        this.flushed = false;
    }

    compact(keepLast = 10) {
        if (this.entries.length > keepLast) {
            this.entries = this.entries.slice(-keepLast);
        }
    }

    replay() {
        return [...this.entries];
    }

    flush() {
        this.flushed = true;
    }

    get length() {
        return this.entries.length;
    }

    get lastEntry() {
        return this.entries[this.entries.length - 1] || null;
    }

    clear() {
        this.entries = [];
        this.flushed = false;
    }

    toJSON() {
        return {
            entries: this.entries,
            flushed: this.flushed
        };
    }

    static fromJSON(data) {
        return new TranscriptStore({
            entries: data.entries || [],
            flushed: data.flushed || false
        });
    }
}

export default { TranscriptStore };
