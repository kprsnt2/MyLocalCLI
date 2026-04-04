// Tool Permission System
// Ported from claw-code's permissions.py

export class ToolPermissionContext {
    constructor({ denyNames = [], denyPrefixes = [] } = {}) {
        this.denyNames = new Set(denyNames.map(n => n.toLowerCase()));
        this.denyPrefixes = denyPrefixes.map(p => p.toLowerCase());
    }

    blocks(toolName) {
        const lowered = toolName.toLowerCase();
        if (this.denyNames.has(lowered)) return true;
        return this.denyPrefixes.some(prefix => lowered.startsWith(prefix));
    }

    allows(toolName) {
        return !this.blocks(toolName);
    }

    filterTools(tools) {
        return tools.filter(tool => {
            const name = tool.function?.name || tool.name || '';
            return this.allows(name);
        });
    }

    addDeny(name) {
        this.denyNames.add(name.toLowerCase());
    }

    addDenyPrefix(prefix) {
        this.denyPrefixes.push(prefix.toLowerCase());
    }

    removeDeny(name) {
        this.denyNames.delete(name.toLowerCase());
    }

    get summary() {
        return {
            deniedNames: [...this.denyNames],
            deniedPrefixes: [...this.denyPrefixes]
        };
    }

    formatSummary() {
        const lines = [];
        if (this.denyNames.size > 0) {
            lines.push(`Denied tools: ${[...this.denyNames].join(', ')}`);
        }
        if (this.denyPrefixes.length > 0) {
            lines.push(`Denied prefixes: ${this.denyPrefixes.join(', ')}`);
        }
        if (lines.length === 0) {
            lines.push('All tools allowed');
        }
        return lines.join('\n');
    }
}

// Pre-defined permission profiles
export const PERMISSION_PROFILES = {
    full: new ToolPermissionContext(),
    readonly: new ToolPermissionContext({
        denyNames: ['write_file', 'edit_file', 'multi_edit_file', 'delete_file',
            'append_file', 'move_file', 'copy_file', 'create_directory',
            'run_command', 'git_commit', 'find_replace', 'insert_at_line']
    }),
    safe: new ToolPermissionContext({
        denyNames: ['run_command', 'delete_file'],
        denyPrefixes: ['git_']
    }),
    noExec: new ToolPermissionContext({
        denyNames: ['run_command']
    })
};

export default { ToolPermissionContext, PERMISSION_PROFILES };
