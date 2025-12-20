import { BaseProvider } from './base.js';

// Ollama provider - another popular local LLM option
export class OllamaProvider extends BaseProvider {
    constructor(config = {}) {
        super({
            baseUrl: config.baseUrl || 'http://localhost:11434',
            model: config.model || 'llama3.2',
            ...config
        });
    }

    async chat(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: formattedMessages,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama Error (${response.status}): ${error}`);
        }

        const data = await response.json();
        return data.message?.content || '';
    }

    async *stream(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: formattedMessages,
                stream: true,
                options: {
                    temperature: options.temperature || 0.7
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama Error (${response.status}): ${error}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content) {
                        yield parsed.message.content;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }
            const data = await response.json();
            return data.models?.map(m => ({
                id: m.name,
                name: m.name,
                owned_by: 'local',
                size: m.size,
                modified: m.modified_at
            })) || [];
        } catch (error) {
            return [];
        }
    }

    async isServerRunning() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async pullModel(modelName) {
        const response = await fetch(`${this.baseUrl}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName, stream: false })
        });
        return response.ok;
    }
}

export default OllamaProvider;
