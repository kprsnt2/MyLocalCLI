// MyLocalCLI - Autonomous Coding & Agent Loop Engine
// Inspired by oh-my-pi (agent-loop.ts) and Hermes Agent architecture

import { parseToolCalls, executeTool } from './tools.js';
import { toolSpinner } from '../ui/animations.js';
import { printAssistantStart, printAssistantChunk, printAssistantEnd, printWarning, printInfo, colors } from '../ui/terminal.js';

export class AutocodeEngine {
    constructor(options = {}) {
        this.maxTurns = options.maxTurns || 25;
        this.autoVerify = options.autoVerify ?? true;
        this.cwd = options.cwd || process.cwd();
        this.onStep = options.onStep || (() => {});
        this.onToolStart = options.onToolStart || (() => {});
        this.onToolEnd = options.onToolEnd || (() => {});
    }

    /**
     * Run an autonomous multi-turn agent loop until task completion or max turns reached.
     *
     * @param {Object} params
     * @param {Object} params.provider - LLM provider instance (stream method)
     * @param {Array} params.messages - Conversation history
     * @param {string} params.systemPrompt - Full system prompt with tool definitions
     * @param {Object} params.context - Execution context (permissionContext, streamEmitter, etc.)
     * @returns {Promise<{ success: boolean, finalResponse: string, turns: number, toolsExecuted: Array }>}
     */
    async run({ provider, messages, systemPrompt, context = {} }) {
        let turn = 0;
        const toolsExecuted = [];
        let finalResponse = '';
        const conversation = [...messages];

        while (turn < this.maxTurns) {
            turn++;
            this.onStep({ turn, maxTurns: this.maxTurns });

            // Prepare prompt payload with system message
            const currentMessages = [
                { role: 'system', content: systemPrompt },
                ...conversation
            ];

            let assistantTurnOutput = '';
            printAssistantStart();

            try {
                for await (const chunk of provider.stream(currentMessages, {})) {
                    printAssistantChunk(chunk);
                    assistantTurnOutput += chunk;
                }
            } catch (err) {
                printWarning(`\n⚠️ Provider stream error on turn ${turn}: ${err.message}`);
                // Feed error back so model can adjust if needed
                conversation.push({
                    role: 'user',
                    content: `[System Error during generation]: ${err.message}. Please retry or adjust approach.`
                });
                continue;
            } finally {
                printAssistantEnd();
            }

            finalResponse = assistantTurnOutput;

            // Check if model emitted tool calls
            const toolCalls = parseToolCalls(assistantTurnOutput);

            if (!toolCalls || toolCalls.length === 0) {
                // No tools called - the model believes it is done or asking for clarification!
                conversation.push({ role: 'assistant', content: assistantTurnOutput });
                return {
                    success: true,
                    finalResponse,
                    turns: turn,
                    toolsExecuted,
                    conversation
                };
            }

            // Append assistant tool-call response to ongoing conversation
            conversation.push({ role: 'assistant', content: assistantTurnOutput });

            // Execute all requested tools in sequence
            let toolResultsContent = '';

            for (const toolCall of toolCalls) {
                const { name, arguments: args } = toolCall;
                toolsExecuted.push({ turn, name, args, timestamp: new Date().toISOString() });

                // Check permissions if context has permissionContext
                if (context.permissionContext && !context.permissionContext.allows(name)) {
                    printWarning(`🚫 Tool "${name}" blocked by permission policy`);
                    toolResultsContent += `[Tool Blocked: ${name}]\nReason: Tool denied by active permission policy.\n\n`;
                    continue;
                }

                this.onToolStart(name, args);
                const spinner = toolSpinner(name, name);
                spinner.start();

                let result;
                try {
                    result = await executeTool(name, args, this.cwd);
                } catch (execErr) {
                    result = { success: false, error: execErr.message };
                }

                if (result.success) {
                    spinner.succeed(`${name} completed`);
                } else {
                    spinner.fail(`${name} failed: ${result.error || 'unknown error'}`);
                }

                this.onToolEnd(name, result);

                // Format tool result for next iteration
                if (result.success) {
                    const contentStr = typeof result.content === 'string' 
                        ? result.content 
                        : JSON.stringify(result.content || result, null, 2);
                    // Bound content size to avoid blowing context window
                    const truncated = contentStr.length > 8000 
                        ? contentStr.slice(0, 8000) + '\n... [output truncated for length]' 
                        : contentStr;
                    toolResultsContent += `[Tool Result: ${name}]\n${truncated}\n\n`;
                } else {
                    toolResultsContent += `[Tool Failed: ${name}]\nError: ${result.error || 'Execution failed'}\nHint: Analyze the error and self-correct your parameters.\n\n`;
                }
            }

            // Feed tool results back into conversation so the model can inspect and proceed!
            if (toolResultsContent) {
                conversation.push({
                    role: 'user',
                    content: toolResultsContent.trim()
                });
            }
        }

        // Reached max turns without natural termination
        printWarning(`\n⚠️ Reached maximum autonomous turns (${this.maxTurns}). Stopping loop.`);
        return {
            success: false,
            finalResponse,
            turns: turn,
            toolsExecuted,
            conversation,
            reason: 'max_turns_exceeded'
        };
    }
}

export default AutocodeEngine;
