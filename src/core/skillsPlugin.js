import fs from 'fs/promises';
import path from 'path';

export async function loadSkills() {
    const skillsDir = path.join(process.cwd(), '.mylocalcli', 'skills');
    const dynamicTools = [];

    try {
        await fs.mkdir(skillsDir, { recursive: true });
        const files = await fs.readdir(skillsDir);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const skillPath = path.join(skillsDir, file);
                try {
                    // In a real production system, use a safer sandbox.
                    // For local parity, we dynamically import the module
                    const modulePaths = process.platform === 'win32' ? `file://${skillPath.replace(/\\/g, '/')}` : skillPath;
                    const skillModule = await import(modulePaths);
                    if (skillModule.definition) {
                        dynamicTools.push({
                            type: 'function',
                            function: skillModule.definition,
                            execute: skillModule.execute
                        });
                    }
                } catch (e) {
                    console.error(`Failed to load JS skill ${file}:`, e);
                }
            } else if (file.endsWith('.md')) {
                const skillPath = path.join(skillsDir, file);
                try {
                    const content = await fs.readFile(skillPath, 'utf8');
                    
                    // Simple markdown parsing looking for YAML frontmatter or specifically formatted blocks
                    // Assume the format has a name, description, and some instruction block.
                    const nameMatch = content.match(/name:\s*([^\n]+)/);
                    const descMatch = content.match(/description:\s*([^\n]+)/);
                    
                    if (nameMatch && descMatch) {
                        const toolName = nameMatch[1].trim();
                        dynamicTools.push({
                            type: 'function',
                            function: {
                                name: toolName,
                                description: descMatch[1].trim(),
                                parameters: {
                                    type: 'object',
                                    properties: { query: { type: 'string', description: 'Input for the skill' } },
                                    required: ['query']
                                }
                            },
                            execute: async (args) => {
                                return `Skill ${toolName} executed. Markdown instructions:\n${content}\nWith args: ${JSON.stringify(args)}`;
                            }
                        });
                    }
                } catch (e) {
                    console.error(`Failed to load MD skill ${file}:`, e);
                }
            }
        }
    } catch (e) {
        // Directory probably doesn't exist or is unreadable yet, harmless
    }
    
    return dynamicTools;
}

// Global skill cache
export const activeSkills = new Map();
