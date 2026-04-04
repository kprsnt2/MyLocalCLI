// Provider configurations for LocalCoder
export const PROVIDERS = {
  lmstudio: {
    name: 'LM Studio',
    description: 'Local LLM server',
    baseUrl: 'http://localhost:1234/v1',
    requiresApiKey: false,
    icon: '🏠'
  },
  ollama: {
    name: 'Ollama',
    description: 'Local Ollama server',
    baseUrl: 'http://localhost:11434',
    requiresApiKey: false,
    icon: '🦙'
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access free & paid models',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    icon: '🌐',
    freeModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-2-9b-it:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'deepseek/deepseek-chat:free',
      'qwen/qwen-2-7b-instruct:free'
    ]
  },
  openai: {
    name: 'OpenAI',
    description: 'OpenAI API',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    icon: '🔑'
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    icon: '⚡'
  },
  nvidia: {
    name: 'NVIDIA API',
    description: 'NVIDIA NIM inference endpoints',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresApiKey: true,
    icon: '🟢'
  },
  custom: {
    name: 'Custom',
    description: 'Any OpenAI-compatible API',
    baseUrl: '',
    requiresApiKey: false,
    icon: '⚙️'
  }
};

export const DEFAULT_PROVIDER = 'lmstudio';

export const DEFAULT_MODELS = {
  lmstudio: 'local-model',
  ollama: 'llama3.2',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  nvidia: 'z-ai/glm5',
  custom: 'default'
};
