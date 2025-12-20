import Conf from 'conf';
import { PROVIDERS, DEFAULT_PROVIDER, DEFAULT_MODELS } from './providers.js';

const config = new Conf({
    projectName: 'mylocalcli',
    defaults: {
        provider: DEFAULT_PROVIDER,
        models: DEFAULT_MODELS,
        apiKeys: {},
        customEndpoints: {},
        settings: {
            streamOutput: true,
            confirmCommands: true,
            maxContextFiles: 10,
            maxFileSize: 100000 // 100KB
        }
    }
});

export function getConfig() {
    return config.store;
}

export function getProvider() {
    return config.get('provider') || DEFAULT_PROVIDER;
}

export function setProvider(provider) {
    if (!PROVIDERS[provider]) {
        throw new Error(`Unknown provider: ${provider}`);
    }
    config.set('provider', provider);
}

export function getApiKey(provider) {
    const keys = config.get('apiKeys') || {};
    return keys[provider] || process.env[`${provider.toUpperCase()}_API_KEY`] || '';
}

export function setApiKey(provider, key) {
    const keys = config.get('apiKeys') || {};
    keys[provider] = key;
    config.set('apiKeys', keys);
}

export function getModel(provider) {
    const models = config.get('models') || DEFAULT_MODELS;
    return models[provider] || DEFAULT_MODELS[provider] || 'default';
}

export function setModel(provider, model) {
    const models = config.get('models') || {};
    models[provider] = model;
    config.set('models', models);
}

export function getBaseUrl(provider) {
    const customEndpoints = config.get('customEndpoints') || {};
    if (customEndpoints[provider]) {
        return customEndpoints[provider];
    }
    return PROVIDERS[provider]?.baseUrl || '';
}

export function setCustomEndpoint(provider, url) {
    const endpoints = config.get('customEndpoints') || {};
    endpoints[provider] = url;
    config.set('customEndpoints', endpoints);
}

export function getSetting(key) {
    const settings = config.get('settings') || {};
    return settings[key];
}

export function setSetting(key, value) {
    const settings = config.get('settings') || {};
    settings[key] = value;
    config.set('settings', settings);
}

export function resetConfig() {
    config.clear();
}

export default config;
