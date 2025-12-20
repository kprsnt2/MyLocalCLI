// Base provider class for all LLM providers
export class BaseProvider {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || '';
        this.apiKey = config.apiKey || '';
        this.model = config.model || 'default';
        this.timeout = config.timeout || 60000;
    }

    async chat(messages, options = {}) {
        throw new Error('chat() must be implemented by subclass');
    }

    async *stream(messages, options = {}) {
        throw new Error('stream() must be implemented by subclass');
    }

    async listModels() {
        throw new Error('listModels() must be implemented by subclass');
    }

    buildSystemPrompt(context = {}) {
        const parts = [
            'You are LocalCoder, a powerful AI coding assistant running in the terminal.',
            'You help users with coding tasks, explaining code, debugging, and executing commands.',
            '',
            'CAPABILITIES:',
            '- Read and write files in the user\'s project',
            '- Search for files and content',
            '- Execute shell commands (with user confirmation)',
            '- Understand project structure and codebase',
            '',
            'RESPONSE FORMAT:',
            '- Use markdown formatting for code blocks',
            '- Be concise but thorough',
            '- When suggesting file changes, show the complete code',
            '- For commands, explain what they do before suggesting execution',
        ];

        if (context.projectType) {
            parts.push('', `PROJECT TYPE: ${context.projectType}`);
        }

        if (context.currentDir) {
            parts.push(`WORKING DIRECTORY: ${context.currentDir}`);
        }

        if (context.files && context.files.length > 0) {
            parts.push('', 'RELEVANT FILES:', ...context.files.map(f => `- ${f}`));
        }

        return parts.join('\n');
    }

    formatMessages(messages, context = {}) {
        const systemPrompt = this.buildSystemPrompt(context);
        return [
            { role: 'system', content: systemPrompt },
            ...messages
        ];
    }

    async makeRequest(endpoint, body) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error (${response.status}): ${error}`);
        }

        return response;
    }
}

export default BaseProvider;
