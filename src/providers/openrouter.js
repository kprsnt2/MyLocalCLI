import { BaseProvider } from './base.js';

// OpenRouter provider - access to many free and paid models
export class OpenRouterProvider extends BaseProvider {
    constructor(config = {}) {
        super({
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: config.apiKey || process.env.OPENROUTER_API_KEY || '',
            model: config.model || 'deepseek/deepseek-r1:free',
            ...config
        });

        this.freeModels = [
            // Top Tier - Best for coding with tools
            { id: 'deepseek/deepseek-r1:free', name: '🔥 DeepSeek R1 671B (Free)', provider: 'DeepSeek' },
            { id: 'deepseek/deepseek-chat-v3-0324:free', name: '💬 DeepSeek Chat V3 (Free)', provider: 'DeepSeek' },
            { id: 'qwen/qwen3-coder-480b-a35b:free', name: '💻 Qwen3 Coder 480B (Free)', provider: 'Alibaba' },
            { id: 'meta-llama/llama-4-maverick:free', name: '🦙 Llama 4 Maverick (Free)', provider: 'Meta' },
            { id: 'meta-llama/llama-4-scout:free', name: '🦙 Llama 4 Scout (Free)', provider: 'Meta' },
            { id: 'meta-llama/llama-3.3-70b-instruct:free', name: '🦙 Llama 3.3 70B (Free)', provider: 'Meta' },
            // Good alternatives
            { id: 'nvidia/llama-3.1-nemotron-nano-8b-v1:free', name: '⚡ Nemotron Nano 8B (Free)', provider: 'NVIDIA' },
            { id: 'google/gemma-2-9b-it:free', name: '💎 Gemma 2 9B (Free)', provider: 'Google' },
            { id: 'qwen/qwen2.5-vl-3b-instruct:free', name: '👁️ Qwen 2.5 VL 3B (Free)', provider: 'Alibaba' },
            { id: 'microsoft/phi-3-mini-128k-instruct:free', name: '🔬 Phi-3 Mini 128K (Free)', provider: 'Microsoft' },
            { id: 'mistralai/mistral-7b-instruct:free', name: '🌬️ Mistral 7B (Free)', provider: 'Mistral' }
        ];
    }

    async chat(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://mylocalcli.dev',
            'X-Title': 'MyLocalCLI'
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.model,
                messages: formattedMessages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 4096,
                stream: false
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter Error (${response.status}): ${error}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    async *stream(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://mylocalcli.dev',
            'X-Title': 'MyLocalCLI'
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
            throw new Error(`OpenRouter Error (${response.status}): ${error}`);
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
        // Return free models by default
        return this.freeModels.map(m => ({
            id: m.id,
            name: m.name,
            owned_by: m.provider
        }));
    }

    getFreeModels() {
        return this.freeModels;
    }
}

export default OpenRouterProvider;
