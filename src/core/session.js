// Session Store with Token Tracking
// Ported from claw-code's session_store.py

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const SESSION_DIR = path.join(os.homedir(), '.mylocalcli', 'sessions');

export class StoredSession {
    constructor({ sessionId, messages = [], inputTokens = 0, outputTokens = 0, createdAt = null, provider = null, model = null }) {
        this.sessionId = sessionId || crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex');
        this.messages = messages;
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        this.createdAt = createdAt || new Date().toISOString();
        this.provider = provider;
        this.model = model;
    }

    get totalTokens() {
        return this.inputTokens + this.outputTokens;
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            messages: this.messages,
            inputTokens: this.inputTokens,
            outputTokens: this.outputTokens,
            createdAt: this.createdAt,
            provider: this.provider,
            model: this.model
        };
    }

    static fromJSON(data) {
        return new StoredSession({
            sessionId: data.sessionId,
            messages: data.messages || [],
            inputTokens: data.inputTokens || 0,
            outputTokens: data.outputTokens || 0,
            createdAt: data.createdAt,
            provider: data.provider,
            model: data.model
        });
    }
}

export async function ensureSessionDir(directory = SESSION_DIR) {
    await fs.mkdir(directory, { recursive: true });
}

export async function saveSession(session, directory = SESSION_DIR) {
    await ensureSessionDir(directory);
    const filePath = path.join(directory, `${session.sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(session.toJSON(), null, 2));
    return filePath;
}

export async function loadSession(sessionId, directory = SESSION_DIR) {
    const filePath = path.join(directory, `${sessionId}.json`);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    return StoredSession.fromJSON(data);
}

export async function listSessions(directory = SESSION_DIR) {
    await ensureSessionDir(directory);
    const files = await fs.readdir(directory);
    const sessions = [];
    for (const file of files) {
        if (file.endsWith('.json')) {
            try {
                const data = JSON.parse(await fs.readFile(path.join(directory, file), 'utf-8'));
                sessions.push(StoredSession.fromJSON(data));
            } catch {
                // skip corrupted files
            }
        }
    }
    return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteSession(sessionId, directory = SESSION_DIR) {
    const filePath = path.join(directory, `${sessionId}.json`);
    try {
        await fs.unlink(filePath);
        return true;
    } catch {
        return false;
    }
}

export default {
    StoredSession,
    saveSession,
    loadSession,
    listSessions,
    deleteSession
};
