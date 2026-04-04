import { BaseProvider } from './base.js';

// NVIDIA API provider - OpenAI-compatible endpoint
export class NvidiaProvider extends BaseProvider {
    constructor(config = {}) {
        super({
            baseUrl: config.baseUrl || 'https://integrate.api.nvidia.com/v1',
            apiKey: config.apiKey || process.env.NVIDIA_API_KEY || '',
            model: config.model || 'z-ai/glm5',
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
            throw new Error(`NVIDIA API Error (${response.status}): ${error}`);
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
                    } catch {
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
                owned_by: m.owned_by || 'nvidia'
            })) || [];
        } catch {
            return [
                { id: 'z-ai/glm5', name: 'Z-AI GLM5 (Default)', owned_by: 'NVIDIA' },
                { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', owned_by: 'NVIDIA' },
                { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', owned_by: 'NVIDIA' },
                { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', owned_by: 'NVIDIA' },
                { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', owned_by: 'NVIDIA' },
                { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B', owned_by: 'NVIDIA' }
            ];
        }
    }

    async isServerRunning() {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export default NvidiaProvider;
