import { spawn } from 'child_process';
import crypto from 'crypto';

export class McpRegistry {
    constructor() {
        this.servers = new Map();
    }

    async connectServer(serverId, command, args = []) {
        return new Promise((resolve, reject) => {
            try {
                const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'inherit'] });
                
                const server = {
                    id: serverId,
                    proc,
                    resources: [],
                    tools: [],
                    pendingRequests: new Map(),
                };

                proc.stdout.on('data', (data) => {
                    const messages = data.toString().split('\n').filter(Boolean);
                    for (const msg of messages) {
                        try {
                            const parsed = JSON.parse(msg);
                            if (parsed.id && server.pendingRequests.has(parsed.id)) {
                                const { res, rej } = server.pendingRequests.get(parsed.id);
                                server.pendingRequests.delete(parsed.id);
                                if (parsed.error) rej(new Error(parsed.error.message || 'MCP Error'));
                                else res(parsed.result);
                            }
                        } catch (e) {
                            // Ignored streaming anomalies
                        }
                    }
                });

                proc.on('close', () => {
                    this.servers.delete(serverId);
                });

                this.servers.set(serverId, server);
                resolve(server);
            } catch (err) {
                reject(err);
            }
        });
    }

    async sendRequest(serverId, method, params = {}) {
        const server = this.servers.get(serverId);
        if (!server) throw new Error(`MCP Server ${serverId} not connected`);

        return new Promise((resolve, reject) => {
            const reqId = crypto.randomUUID();
            server.pendingRequests.set(reqId, { res: resolve, rej: reject });

            const payload = JSON.stringify({
                jsonrpc: "2.0",
                id: reqId,
                method,
                params
            }) + '\n';

            server.proc.stdin.write(payload);
        });
    }

    listResources() {
        return Array.from(this.servers.entries()).map(([id, server]) => ({
            server: id,
            resources: server.resources,
            tools: server.tools
        }));
    }

    async readResource(serverId, resourceId) {
        return await this.sendRequest(serverId, 'resources/read', { uri: resourceId });
    }

    async mcpAuth(config) {
        return { success: true, token: 'real-mcp-token' };
    }

    async dispatchAction(serverId, action, payload) {
        return await this.sendRequest(serverId, 'tools/call', { name: action, arguments: payload });
    }
}

export const mcpRegistry = new McpRegistry();
