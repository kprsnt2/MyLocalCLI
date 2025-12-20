import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const HISTORY_DIR = path.join(os.homedir(), '.localcoder', 'conversations');

// Enhanced conversation management with named sessions
export async function ensureHistoryDir() {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
}

export function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Create a new named conversation
export async function createConversation(name, metadata = {}) {
    await ensureHistoryDir();

    const id = generateSessionId();
    const conversation = {
        id,
        name: name || `Chat ${new Date().toLocaleDateString()}`,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        metadata,
        messages: []
    };

    const filePath = path.join(HISTORY_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));

    return conversation;
}

// Save a message to a conversation
export async function saveMessage(sessionId, message) {
    await ensureHistoryDir();
    const filePath = path.join(HISTORY_DIR, `${sessionId}.json`);

    let conversation;
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        conversation = JSON.parse(content);
    } catch {
        // Create new conversation if doesn't exist
        conversation = {
            id: sessionId,
            name: `Chat ${new Date().toLocaleDateString()}`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            messages: []
        };
    }

    conversation.messages.push({
        ...message,
        timestamp: new Date().toISOString()
    });
    conversation.modified = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
    return conversation;
}

// Load a specific conversation
export async function loadConversation(sessionId) {
    try {
        const filePath = path.join(HISTORY_DIR, `${sessionId}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

// List all conversations
export async function listConversations() {
    await ensureHistoryDir();

    try {
        const files = await fs.readdir(HISTORY_DIR);
        const conversations = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(HISTORY_DIR, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const conversation = JSON.parse(content);

                    conversations.push({
                        id: conversation.id,
                        name: conversation.name,
                        created: conversation.created,
                        modified: conversation.modified,
                        messageCount: conversation.messages?.length || 0,
                        preview: conversation.messages?.[0]?.content?.slice(0, 50) || ''
                    });
                } catch {
                    // Skip invalid files
                }
            }
        }

        return conversations.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    } catch {
        return [];
    }
}

// Rename a conversation
export async function renameConversation(sessionId, newName) {
    const conversation = await loadConversation(sessionId);
    if (!conversation) return false;

    conversation.name = newName;
    conversation.modified = new Date().toISOString();

    const filePath = path.join(HISTORY_DIR, `${sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
    return true;
}

// Delete a conversation
export async function deleteConversation(sessionId) {
    try {
        const filePath = path.join(HISTORY_DIR, `${sessionId}.json`);
        await fs.unlink(filePath);
        return true;
    } catch {
        return false;
    }
}

// Clear all conversations
export async function clearAllConversations() {
    try {
        const files = await fs.readdir(HISTORY_DIR);
        for (const file of files) {
            if (file.endsWith('.json')) {
                await fs.unlink(path.join(HISTORY_DIR, file));
            }
        }
        return true;
    } catch {
        return false;
    }
}

// Export a conversation as markdown
export async function exportConversation(sessionId) {
    const conversation = await loadConversation(sessionId);
    if (!conversation) return null;

    let md = `# ${conversation.name}\n\n`;
    md += `*Created: ${new Date(conversation.created).toLocaleString()}*\n\n`;
    md += `---\n\n`;

    for (const msg of conversation.messages) {
        const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Assistant**';
        md += `${role}\n\n${msg.content}\n\n---\n\n`;
    }

    return md;
}

// Legacy support
export async function loadSession(sessionId) {
    const conv = await loadConversation(sessionId);
    return conv?.messages || [];
}

export async function listSessions() {
    return listConversations();
}

export async function deleteSession(sessionId) {
    return deleteConversation(sessionId);
}

export async function clearAllHistory() {
    return clearAllConversations();
}

export default {
    ensureHistoryDir,
    generateSessionId,
    createConversation,
    saveMessage,
    loadConversation,
    listConversations,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    exportConversation,
    loadSession,
    listSessions,
    deleteSession,
    clearAllHistory
};
