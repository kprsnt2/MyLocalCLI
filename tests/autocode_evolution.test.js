import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EvolutionEngine } from '../src/core/evolution.js';
import { AutocodeEngine } from '../src/core/autocode.js';
import { executeTool } from '../src/core/tools.js';
import { renderMarkdown } from '../src/ui/markdown.js';

describe('EvolutionEngine (Hermes & oh-my-pi Self-Learning)', () => {
    let tempDir;
    let engine;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mlc2-evo-test-'));
        engine = new EvolutionEngine(tempDir);
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {}
    });

    it('records invariants and persists to memory.json', async () => {
        await engine.recordInvariant('Always compile with --release', 'build');
        const memory = await engine.loadMemory();

        expect(memory.invariants.length).toBe(1);
        expect(memory.invariants[0].rule).toBe('Always compile with --release');
        expect(memory.invariants[0].category).toBe('build');
    });

    it('records reflections and updates lessons learned', async () => {
        await engine.recordReflection({
            mistake: 'SyntaxError: unexpected token',
            cause: 'Forgot to close brace',
            solution: 'Closed brace on line 42',
            rule: 'Lint before saving'
        });

        const memory = await engine.loadMemory();
        expect(memory.lessonsLearned.length).toBe(1);
        expect(memory.lessonsLearned[0].mistake).toBe('SyntaxError: unexpected token');
        // Rule should also be saved into invariants
        expect(memory.invariants.some(i => i.rule === 'Lint before saving')).toBe(true);
    });

    it('synthesizes new reusable skills', async () => {
        const res = await engine.learnSkill({
            name: 'docker-deploy',
            description: 'Builds and deploys container',
            instructions: 'Run docker build -t app .',
            triggers: ['docker', 'deploy']
        });

        expect(res.success).toBe(true);
        const skillContent = await fs.readFile(res.path, 'utf-8');
        expect(skillContent).toContain('name: docker-deploy');
        expect(skillContent).toContain('Run docker build -t app .');
    });

    it('formats context for system prompt injection', async () => {
        await engine.recordInvariant('Port 8080 is reserved', 'network');
        await engine.recordReflection({
            mistake: 'Wrong port used',
            solution: 'Use 8080'
        });

        const prompt = await engine.formatContextForPrompt();
        expect(prompt).toContain('LEARNED MEMORY & PROJECT INVARIANTS');
        expect(prompt).toContain('Port 8080 is reserved');
        expect(prompt).toContain('Wrong port used');
    });
});

describe('Surgical Edit & Smart Read Tools (oh-my-pi style)', () => {
    let tempDir;
    let testFile;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mlc2-tools-test-'));
        testFile = path.join(tempDir, 'test.js');
        const initialContent = [
            '// Line 1',
            'const a = 1;',
            'const b = 2;',
            'const c = 3;',
            '// Line 5'
        ].join('\n');
        await fs.writeFile(testFile, initialContent, 'utf-8');
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {}
    });

    it('surgically replaces lines by range', async () => {
        const res = await executeTool('surgical_edit', {
            path: testFile,
            start_line: 2,
            end_line: 3,
            new_content: 'const replaced = 99;',
            operation: 'replace'
        }, tempDir);

        expect(res.success).toBe(true);
        const updated = await fs.readFile(testFile, 'utf-8');
        const lines = updated.split('\n');
        expect(lines[1]).toBe('const replaced = 99;');
        expect(lines[2]).toBe('const c = 3;');
    });

    it('surgically inserts before a line', async () => {
        const res = await executeTool('surgical_edit', {
            path: testFile,
            start_line: 2,
            new_content: 'const before = 0;',
            operation: 'insert_before'
        }, tempDir);

        expect(res.success).toBe(true);
        const updated = await fs.readFile(testFile, 'utf-8');
        const lines = updated.split('\n');
        expect(lines[1]).toBe('const before = 0;');
        expect(lines[2]).toBe('const a = 1;');
    });

    it('surgically deletes lines', async () => {
        const res = await executeTool('surgical_edit', {
            path: testFile,
            start_line: 2,
            end_line: 3,
            operation: 'delete'
        }, tempDir);

        expect(res.success).toBe(true);
        const updated = await fs.readFile(testFile, 'utf-8');
        const lines = updated.split('\n');
        expect(lines.length).toBe(3);
        expect(lines[1]).toBe('const c = 3;');
    });

    it('smart reads with range selector', async () => {
        const res = await executeTool('smart_read', {
            path: `${testFile}:2-4`
        }, tempDir);

        expect(res.success).toBe(true);
        expect(res.content).toContain('2:const a = 1;');
        expect(res.content).toContain('3:const b = 2;');
        expect(res.content).toContain('4:const c = 3;');
    });
});

describe('AutocodeEngine (Multi-turn Autonomous Execution)', () => {
    it('stops naturally when model outputs final answer without tool calls', async () => {
        const engine = new AutocodeEngine({ maxTurns: 5 });
        const mockProvider = {
            async *stream() {
                yield 'Here is the completed task. Everything is done!';
            }
        };

        const res = await engine.run({
            provider: mockProvider,
            messages: [{ role: 'user', content: 'Say hello' }],
            systemPrompt: 'System'
        });

        expect(res.success).toBe(true);
        expect(res.turns).toBe(1);
        expect(res.finalResponse).toContain('completed task');
    });
});

describe('Unicode & Indic Markdown Rendering Safety', () => {
    it('renders Telugu text cleanly without breaking syllables', () => {
        const telugu = 'ఇది సోర్స్ కోడ్ ను క్లౌడ్ బిల్డ్ కి పంపి, కంటైనర్ తయారు చేసి, మీకు లైవ్ సర్వీస్ URL ఇచ్చేస్తుంది.';
        const rendered = renderMarkdown(telugu);
        // Ensure no artificial spacing or breaking injected into words
        expect(rendered).toContain('క్లౌడ్');
        expect(rendered).toContain('బిల్డ్');
        expect(rendered).toContain('సర్వీస్');
    });
});
