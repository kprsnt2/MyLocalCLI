// MyLocalCLI - Hooks System
// Event-driven hook execution inspired by Claude Code

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { printInfo, printWarning, colors } from '../ui/terminal.js';

const execAsync = promisify(exec);

/**
 * Hook event types
 */
export const HOOK_EVENTS = {
    PRE_TOOL_USE: 'PreToolUse',
    POST_TOOL_USE: 'PostToolUse',
    SESSION_START: 'SessionStart',
    SESSION_END: 'SessionEnd',
    STOP: 'Stop',
    USER_PROMPT: 'UserPromptSubmit'
};

/**
 * Hook decision types
 */
export const HOOK_DECISIONS = {
    ALLOW: 'allow',
    DENY: 'deny',
    WARN: 'warn',
    MODIFY: 'modify'
};

// Registered hooks by event type
const HOOKS = {
    [HOOK_EVENTS.PRE_TOOL_USE]: [],
    [HOOK_EVENTS.POST_TOOL_USE]: [],
    [HOOK_EVENTS.SESSION_START]: [],
    [HOOK_EVENTS.SESSION_END]: [],
    [HOOK_EVENTS.STOP]: [],
    [HOOK_EVENTS.USER_PROMPT]: []
};

/**
 * Register a hook for an event
 * @param {string} event - Event type from HOOK_EVENTS
 * @param {Object} hook - Hook configuration
 */
export function registerHook(event, hook) {
    if (HOOKS[event]) {
        HOOKS[event].push(hook);
    }
}

/**
 * Register hooks from plugin configuration
 * @param {Object} hooksConfig - Hooks configuration object
 * @param {string} pluginName - Name of the plugin
 */
export function registerPluginHooks(hooksConfig, pluginName) {
    for (const [event, eventHooks] of Object.entries(hooksConfig)) {
        if (HOOKS[event] && Array.isArray(eventHooks)) {
            for (const hookList of eventHooks) {
                const hooks = hookList.hooks || [hookList];
                const matcher = hookList.matcher || '.*';

                for (const hook of hooks) {
                    HOOKS[event].push({
                        ...hook,
                        matcher: new RegExp(matcher),
                        plugin: pluginName
                    });
                }
            }
        }
    }
}

/**
 * Execute hooks for an event
 * @param {string} event - Event type
 * @param {Object} context - Event context (tool name, args, etc.)
 * @returns {Promise<{allowed: boolean, message?: string, modified?: Object}>}
 */
export async function executeHooks(event, context) {
    const hooks = HOOKS[event] || [];
    let result = { allowed: true };

    for (const hook of hooks) {
        // Check matcher for tool-related events
        if (hook.matcher && context.toolName) {
            if (!hook.matcher.test(context.toolName)) {
                continue;
            }
        }

        try {
            const hookResult = await executeHook(hook, context);

            // Handle hook decision
            if (hookResult.decision === HOOK_DECISIONS.DENY) {
                result.allowed = false;
                result.message = hookResult.systemMessage || 'Blocked by hook';
                result.hook = hook;
                break;
            } else if (hookResult.decision === HOOK_DECISIONS.WARN) {
                printWarning(`⚠️  ${hookResult.systemMessage || 'Hook warning'}`);
            } else if (hookResult.decision === HOOK_DECISIONS.MODIFY) {
                result.modified = hookResult.modified;
            }
        } catch (error) {
            console.error(`Hook execution error:`, error.message);
        }
    }

    return result;
}

/**
 * Execute a single hook
 * @param {Object} hook - Hook configuration
 * @param {Object} context - Execution context
 */
async function executeHook(hook, context) {
    if (hook.type === 'command') {
        return await executeCommandHook(hook, context);
    } else if (hook.type === 'function') {
        return await executeFunctionHook(hook, context);
    } else if (hook.type === 'pattern') {
        return await executePatternHook(hook, context);
    }

    return { decision: HOOK_DECISIONS.ALLOW };
}

/**
 * Execute a command-based hook (bash script)
 */
async function executeCommandHook(hook, context) {
    const timeout = hook.timeout || 30000;

    try {
        // Prepare input as JSON
        const input = JSON.stringify({
            event: context.event,
            tool_name: context.toolName,
            tool_input: context.toolInput,
            cwd: context.cwd
        });

        // Execute command with input on stdin
        const { stdout, stderr } = await execAsync(hook.command, {
            timeout,
            input,
            cwd: context.cwd,
            env: { ...process.env, MYLOCALCLI_HOOK: 'true' }
        });

        // Parse hook output
        try {
            const result = JSON.parse(stdout.trim());
            return {
                decision: result.hookSpecificOutput?.permissionDecision || HOOK_DECISIONS.ALLOW,
                systemMessage: result.systemMessage,
                modified: result.modified
            };
        } catch (e) {
            // Non-JSON output - treat as allow
            return { decision: HOOK_DECISIONS.ALLOW, output: stdout };
        }
    } catch (error) {
        // Exit code 2 = deny
        if (error.code === 2 && error.stderr) {
            try {
                const result = JSON.parse(error.stderr);
                return {
                    decision: result.hookSpecificOutput?.permissionDecision || HOOK_DECISIONS.DENY,
                    systemMessage: result.systemMessage
                };
            } catch (e) {
                return { decision: HOOK_DECISIONS.DENY, systemMessage: error.stderr };
            }
        }
        // Other errors - allow but log
        console.error(`Hook command error:`, error.message);
        return { decision: HOOK_DECISIONS.ALLOW };
    }
}

/**
 * Execute a function-based hook
 */
async function executeFunctionHook(hook, context) {
    if (typeof hook.handler === 'function') {
        return await hook.handler(context);
    }
    return { decision: HOOK_DECISIONS.ALLOW };
}

/**
 * Execute a pattern-based hook (regex matching)
 */
async function executePatternHook(hook, context) {
    const pattern = new RegExp(hook.pattern, hook.flags || 'i');
    let textToMatch = '';

    // Determine what to match based on event
    if (context.toolName === 'run_command' && context.toolInput?.command) {
        textToMatch = context.toolInput.command;
    } else if (context.toolInput?.path) {
        textToMatch = context.toolInput.path;
    } else if (context.toolInput?.content) {
        textToMatch = context.toolInput.content;
    }

    if (pattern.test(textToMatch)) {
        return {
            decision: hook.action === 'block' ? HOOK_DECISIONS.DENY : HOOK_DECISIONS.WARN,
            systemMessage: hook.message || `Pattern matched: ${hook.pattern}`
        };
    }

    return { decision: HOOK_DECISIONS.ALLOW };
}

/**
 * Get all registered hooks for an event
 */
export function getHooksForEvent(event) {
    return HOOKS[event] || [];
}

/**
 * Clear all hooks (useful for testing)
 */
export function clearHooks() {
    for (const event of Object.keys(HOOKS)) {
        HOOKS[event] = [];
    }
}

// ========================================
// BUILT-IN SAFETY HOOKS
// ========================================

/**
 * Register default safety hooks
 */
export function registerDefaultHooks() {
    // Warn on dangerous rm commands
    registerHook(HOOK_EVENTS.PRE_TOOL_USE, {
        type: 'pattern',
        matcher: /run_command/,
        pattern: 'rm\\s+-rf\\s+(/|~|\\$HOME)',
        action: 'warn',
        message: '⚠️  Dangerous rm command detected. Please verify the path carefully.'
    });

    // Warn on chmod 777
    registerHook(HOOK_EVENTS.PRE_TOOL_USE, {
        type: 'pattern',
        matcher: /run_command/,
        pattern: 'chmod\\s+777',
        action: 'warn',
        message: '⚠️  chmod 777 is insecure. Consider using more restrictive permissions.'
    });

    // Warn on sudo usage
    registerHook(HOOK_EVENTS.PRE_TOOL_USE, {
        type: 'pattern',
        matcher: /run_command/,
        pattern: '^sudo\\s+',
        action: 'warn',
        message: '⚠️  Command requires sudo. Make sure you trust this operation.'
    });
}

export default {
    HOOK_EVENTS,
    HOOK_DECISIONS,
    registerHook,
    registerPluginHooks,
    executeHooks,
    getHooksForEvent,
    clearHooks,
    registerDefaultHooks
};
