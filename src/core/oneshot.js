import { createProvider } from './chat.js';
import { getProvider, getModel, getApiKey, getBaseUrl } from '../config/settings.js';
import { getRelevantContext, formatContextForPrompt } from './context.js';
import { loadProjectConfig, formatProjectConfigForPrompt } from '../config/project.js';
import { parseToolCalls, executeTool } from './tools.js';
import { ToolPermissionContext } from './permissions.js';

/**
 * Execute a single prompt without starting the interactive TUI.
 * Mirrors the parity features of claw-code oneshot workflow.
 */
export async function runOneShot(prompt, options = {}) {
    const cwd = options.cwd || process.cwd();
    const providerName = options.provider || getProvider();
    const provider = createProvider(providerName);
    
    // Process permissions
    const permissionContext = new ToolPermissionContext();
    if (options.permissionMode === 'read-only') {
        permissionContext.profile = 'readonly';
    }
    
    let allowedToolsSet = null;
    if (options.allowedTools) {
        allowedToolsSet = new Set(options.allowedTools.split(',').map(t => t.trim()));
    }
    
    // Gather Context
    const context = await getRelevantContext(cwd, prompt);
    const projectConfig = await loadProjectConfig(cwd);
    
    let systemContent = `You are MyLocalCLI in one-shot execution mode.
Working directory: ${cwd}
Project type: ${context.projectType || 'unknown'}

Complete the user's task and exit. Provide the final response directly.`;

    if (projectConfig) {
        systemContent += '\n\n' + formatProjectConfigForPrompt(projectConfig);
    }
    
    if (options.outputFormat === 'json') {
        systemContent += '\n\nIMPORTANT: You must return ONLY raw JSON as your final response, formatted according to the implied user request. Do not wrap it in markdown block quotes (e.g. no ```json).';
    }
    
    // Tools block
    if (options.enableTools) {
        systemContent += `\n\n## TOOL USAGE
Outputs must be strictly JSON objects formatted as:
\`\`\`json
{
  "tool": "TOOL_NAME",
  "arguments": { ... }
}
\`\`\``;
        // In one shot, we could recursively execute tools, but simple implementation:
        // just let it execute a few loops if needed.
    }
    
    let messages = [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt }
    ];
    
    let loopCount = 0;
    const MAX_LOOPS = 5;
    
    while (loopCount < MAX_LOOPS) {
        let fullResponse = '';
        for await (const chunk of provider.stream(messages, {})) {
            fullResponse += chunk;
        }
        
        let toolCalls = [];
        try {
            toolCalls = parseToolCalls(fullResponse);
        } catch (e) { }
        
        if (toolCalls.length === 0) {
            // Finished
            if (options.outputFormat === 'json') {
                try {
                    // Try to clean up markdown if they violated it
                    let cleanResp = fullResponse.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
                    console.log(cleanResp);
                } catch (e) {
                    console.log(fullResponse);
                }
            } else {
                console.log(fullResponse);
            }
            break;
        } else {
            messages.push({ role: 'assistant', content: fullResponse });
            
            for (const toolCall of toolCalls) {
                // Check allowed tools flag and permission mode
                if (allowedToolsSet && !allowedToolsSet.has(toolCall.name)) {
                     messages.push({ role: 'user', content: `Tool error: Tool ${toolCall.name} is not allowed by configuration.` });
                     continue;
                }
                
                if (!permissionContext.allows(toolCall.name)) {
                     messages.push({ role: 'user', content: `Tool error: Tool ${toolCall.name} is blocked by permission mode.` });
                     continue;
                }
                
                // execute tool
                const result = await executeTool(toolCall.name, toolCall.arguments, cwd);
                if (result.success) {
                    messages.push({ role: 'user', content: `[Tool Result]\n${result.content}` });
                } else {
                    messages.push({ role: 'user', content: `[Tool Error]\n${result.error}` });
                }
            }
        }
        loopCount++;
    }
}
