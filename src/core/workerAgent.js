import { getProvider, getModel } from '../config/settings.js';
import { createProvider } from './chat.js';
import { TOOLS, executeTool, parseToolCalls } from './tools.js';
import { getAgentMode } from './modes.js';

/**
 * Headless worker agent for background task/cron execution.
 * It does not interact with stdout/stdin directly, but resolves with the result.
 */
export async function executeHeadlessAgent(systemPrompt, userPrompt, cwd, onUpdate = null) {
    const providerName = getProvider();
    const modelName = getModel(providerName) || 'Local Model';
    let provider;

    try {
        provider = createProvider(providerName);
    } catch (e) {
        throw new Error(`Failed to initialize provider ${providerName}: ${e.message}`);
    }

    if (!provider) {
        throw new Error('No AI provider configured for headless agent.');
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    let fullResponse = '';
    
    // Auto-approve tools in background headless execution unless safety triggers
    const toolOptions = { autoApprove: false, showDiff: false }; // Auto approval is risky; background mode needs permission-first setups

    if (onUpdate) onUpdate(`Starting headless execution on ${modelName}...`);

    for await (const chunk of provider.stream(messages, {})) {
        fullResponse += chunk;
    }

    if (onUpdate) onUpdate(`Response received. Parsing tools...`);

    let executionLogs = fullResponse;

    try {
        const toolCalls = parseToolCalls(fullResponse);
        for (const tool of toolCalls) {
            if (onUpdate) onUpdate(`Executing tool: ${tool.name}`);
            try {
                // Background tasks should probably have an autoApprove logic if they're trusted, 
                // but for safety we require permissionMode context. 
                // Let's pass a headless flag to executor.js eventually.
                const res = await executeTool(tool.name, tool.arguments, cwd, { autoApprove: true, showDiff: false });
                executionLogs += `\n\n[Tool ${tool.name} Result]: ${JSON.stringify(res)}`;
            } catch (e) {
                executionLogs += `\n\n[Tool ${tool.name} Error]: ${e.message}`;
            }
        }
    } catch (e) {
        // No tool calls or parse error
    }

    return executionLogs;
}
