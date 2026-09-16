import { BaseProvider } from './base.js';

// NVIDIA API provider - OpenAI-compatible endpoint
export class NvidiaProvider extends BaseProvider {
    constructor(config = {}) {
        super({
            baseUrl: config.baseUrl || 'https://integrate.api.nvidia.com/v1',
            apiKey: config.apiKey || process.env.NVIDIA_API_KEY || '',
            model: config.model || 'z-ai/glm-5.3-flash',
            ...config
        });
    }

    /**
     * Automatically heal model on deprecation/error code (410, 404, 400).
     */
    /**
     * Automatically heal model on deprecation/error code (410, 404, 403, 400).
     */
    async autoHealModel(statusCode, errorText = '') {
        this.failedModels = this.failedModels || new Set();
        this.failedModels.add(this.model);

        console.log(`\n⚡ Auto-Heal: Detected error (${statusCode}) for model "${this.model}". Finding active replacement...`);
        const available = await this.listModels();
        if (!available || available.length === 0) return null;

        const modelIds = available.map(m => m.id).filter(id => !this.failedModels.has(id));
        const oldModel = this.model;
        let replacement = null;

        // 1. High-compatibility proven models on NVIDIA NIM
        const provenModels = [
            'meta/llama-3.1-70b-instruct',
            'meta/llama-3.2-11b-vision-instruct',
            'mistralai/mistral-7b-instruct-v0.3',
            'mistralai/mistral-large-2-instruct',
            'nvidia/llama-3.1-nemotron-70b-instruct',
            'deepseek-ai/deepseek-coder-6.7b-instruct',
            'google/gemma-3-12b-it'
        ];
        replacement = provenModels.find(id => modelIds.includes(id));

        // 2. Same family match if not yet tried
        if (!replacement) {
            const familyPart = oldModel.split('/')[1] ? oldModel.split('/')[1].replace(/[0-9.-]/g, '') : '';
            if (familyPart) {
                const familyMatches = modelIds.filter(id => id.includes(familyPart));
                if (familyMatches.length > 0) {
                    replacement = familyMatches[0];
                }
            }
        }

        // 3. Any available unblacklisted model
        if (!replacement && modelIds.length > 0) {
            replacement = modelIds[0];
        }

        if (replacement) {
            console.log(`✅ Auto-Heal Success: Upgraded model from "${oldModel}" to "${replacement}".`);
            this.model = replacement;
            try {
                const { setModel } = await import('../config/settings.js');
                setModel('nvidia', replacement);
            } catch {}
            return replacement;
        }
        return null;
    }

    /**
     * Weekly proactive check to auto-update models if retired or changed.
     */
    async checkWeeklyModelUpdate() {
        try {
            const { getSetting, setSetting } = await import('../config/settings.js');
            const lastCheck = getSetting('last_model_check_nvidia') || 0;
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - lastCheck > oneWeekMs) {
                setSetting('last_model_check_nvidia', Date.now());
                const models = await this.listModels();
                const ids = (models || []).map(m => m.id);
                if (ids.length > 0 && !ids.includes(this.model)) {
                    await this.autoHealModel(410, 'Weekly maintenance check: active model deprecated');
                }
            }
        } catch {}
    }

    async chat(messages, options = {}) {
        await this.checkWeeklyModelUpdate();
        const formattedMessages = this.formatMessages(messages, options.context);

        try {
            const response = await this.makeRequest('/chat/completions', {
                model: this.model,
                messages: formattedMessages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 4096,
                stream: false
            });

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (err) {
            if (err.message.includes('410') || err.message.includes('404') || err.message.includes('model')) {
                const healed = await this.autoHealModel(410, err.message);
                if (healed) {
                    return this.chat(messages, options);
                }
            }
            throw err;
        }
    }
    async *stream(messages, options = {}) {
        await this.checkWeeklyModelUpdate();
        const formattedMessages = this.formatMessages(messages, options.context);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        let response = await fetch(`${this.baseUrl}/chat/completions`, {
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
            if (response.status === 410 || response.status === 404 || response.status === 403 || (response.status === 400 && error.toLowerCase().includes('model'))) {
                const healed = await this.autoHealModel(response.status, error);
                if (healed) {
                    // Seamlessly retry with auto-healed model
                    yield* this.stream(messages, options);
                    return;
                }
            }
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
