export class LspClient {
    constructor() {
        this.activeServer = 'mock-lsp-server';
    }

    async getSymbols(query) {
        return [
            { name: query || 'mockFunction', kind: 'Function', location: { line: 10, character: 4 } }
        ];
    }

    async getReferences(filePath, line, character) {
        return [
            { uri: `file://${filePath}`, range: { start: { line: 20 }, end: { line: 20 } } }
        ];
    }

    async getDiagnostics() {
        return [];
    }

    async getDefinition(filePath, line, character) {
        return {
            uri: `file://${filePath}`,
            range: { start: { line: 1 }, end: { line: 1 } }
        };
    }

    async getHover(filePath, line, character) {
        return {
            contents: ['```typescript\nfunction mockFunction(): void\n```']
        };
    }
}

export const lspClient = new LspClient();
