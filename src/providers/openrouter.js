import { BaseProvider } from './base.js';

// OpenRouter provider - access to many free and paid models
export class OpenRouterProvider extends BaseProvider {
    constructor(config = {}) {
        super({
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: config.apiKey || process.env.OPENROUTER_API_KEY || '',
            model: config.model || 'meta-llama/llama-3.3-70b-instruct:free',
            ...config
        });

        this.freeModels = [
            { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', provider: 'Meta' },
            { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', provider: 'Google' },
            { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini (Free)', provider: 'Microsoft' },
            { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', provider: 'Mistral' },
            { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B (Free)', provider: 'Alibaba' },
            { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Zephyr 7B (Free)', provider: 'HuggingFace' },
            { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B (Free)', provider: 'OpenChat' },
            { id: 'nousresearch/nous-capybara-7b:free', name: 'Nous Capybara 7B (Free)', provider: 'Nous' }
        ];
    }

    async chat(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages, options.context);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://localcoder.dev',
            'X-Title': 'LocalCoder CLI'
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
            'HTTP-Referer': 'https://localcoder.dev',
            'X-Title': 'LocalCoder CLI'
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
