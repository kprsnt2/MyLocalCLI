// MyLocalCLI - Resilient Provider Manager with Auto-Switching & Weekly Health Checks
// Automatically fails over when error codes (401, 403, 410, 429, OFFLINE) occur

import { getProvider, setProvider, getApiKey, getModel, setModel, getSetting, setSetting } from '../config/settings.js';
import { PROVIDERS } from '../config/providers.js';
import { printWarning, printInfo, printSuccess, colors } from '../ui/terminal.js';

export class ProviderManager {
    constructor() {
        this.fallbackOrder = ['nvidia', 'groq', 'openrouter', 'ollama', 'lmstudio', 'openai', 'custom'];
    }

    /**
     * Get candidate providers that have keys or local endpoints configured.
     */
    async getViableProviders() {
        const viable = [];
        for (const name of this.fallbackOrder) {
            const config = PROVIDERS[name];
            if (!config) continue;

            if (name === 'ollama' || name === 'lmstudio') {
                try {
                    const testUrl = name === 'ollama' ? 'http://localhost:11434/api/tags' : 'http://localhost:1234/v1/models';
                    const res = await fetch(testUrl, { signal: AbortSignal.timeout(1500) });
                    if (res.ok) viable.push({ name, type: 'local', ready: true });
                } catch {}
            } else if (config.requiresApiKey) {
                const key = getApiKey(name);
                if (key && key.trim().length > 0) {
                    viable.push({ name, type: 'cloud', ready: true });
                }
            }
        }
        return viable;
    }

    /**
     * Automatically switch to the next viable provider when an error code occurs.
     *
     * @param {string} failedProvider - The provider that threw an error
     * @param {number|string} statusCode - HTTP error code (e.g. 401, 403, 429, 410)
     * @param {string} errorMessage - Error details
     * @returns {Promise<string|null>} Next provider name, or null if none available
     */
    async handleProviderFailure(failedProvider, statusCode, errorMessage = '') {
        console.log(colors.warning(`\n⚠️ Provider Error (${statusCode}) on "${failedProvider}": ${errorMessage}`));

        const viable = await this.getViableProviders();
        const alternatives = viable.filter(p => p.name !== failedProvider);

        if (alternatives.length > 0) {
            const next = alternatives[0].name;
            console.log(colors.success(`🔄 Auto-Switching provider from "${failedProvider}" ➔ "${next}"...`));
            setProvider(next);
            return next;
        }

        // If no alternative has keys, advise how to unblock
        console.log(colors.error(`\n❌ No alternate providers configured or running locally.`));
        console.log(colors.primary(`👉 Quick Ways to Connect:`));
        console.log(`  1. Set a free Groq API key:        node src/index.js config --provider groq --api-key <gsk_...>`);
        console.log(`  2. Set a fresh NVIDIA NIM key:     node src/index.js config --provider nvidia --api-key <nvapi-...>`);
        console.log(`  3. Set a free OpenRouter key:      node src/index.js config --provider openrouter --api-key <sk-or-...>`);
        console.log(`  4. Start local Ollama:             ollama serve\n`);

        return null;
    }

    /**
     * Weekly health check: Checks configured providers once a week,
     * updates available models, and prunes retired models.
     */
    async checkWeeklyHealth() {
        try {
            const lastCheck = getSetting('last_weekly_provider_check') || 0;
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

            if (Date.now() - lastCheck < oneWeekMs) {
                return; // Already checked this week
            }

            setSetting('last_weekly_provider_check', Date.now());
            console.log(colors.muted(`\n📅 Running weekly provider & model catalog maintenance...`));

            const viable = await this.getViableProviders();
            console.log(colors.muted(`   Found ${viable.length} active provider(s): ${viable.map(v => v.name).join(', ') || 'none'}`));
        } catch {}
    }
}

export const providerManager = new ProviderManager();
export default providerManager;
