import { BaseProvider } from './base.js';

// Generic OpenAI-compatible provider
export class OpenAIProvider extends BaseProvider {
    constructor(config = {}) {
        super({
            baseUrl: config.baseUrl || 'https://api.openai.com/v1',
            apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
            model: config.model || 'gpt-4o-mini',
            ...config
        });
    }

    async chat(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const response = await this.makeRequest('/chat/completions', {
            model: this.model,
            messages: formattedMessages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
            stream: false
        });

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    async *stream(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.model,
                messages: formattedMessages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 4096,
                stream: true
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI Error (${response.status}): ${error}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }
            const data = await response.json();
            return data.data?.map(m => ({
                id: m.id,
                name: m.id,
                owned_by: m.owned_by || 'openai'
            })) || [];
        } catch (error) {
            return [];
        }
    }
}

export default OpenAIProvider;
