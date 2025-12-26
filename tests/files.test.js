import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Import the module
const filesModule = await import('../src/utils/files.js');

describe('files', () => {
    const testDir = path.join(os.tmpdir(), 'mylocalcli-test-' + Date.now());
    const testFile = path.join(testDir, 'test.txt');

    beforeEach(async () => {
        // Create test directory
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        // Cleanup
        try {
            await fs.rm(testDir, { recursive: true });
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    describe('readFile', () => {
        it('should read existing file', async () => {
            await fs.writeFile(testFile, 'Hello World');
            const result = await filesModule.readFile(testFile);
            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello World');
        });

        it('should return error for non-existent file', async () => {
            const result = await filesModule.readFile(path.join(testDir, 'nonexistent.txt'));
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('writeFile', () => {
        it('should write new file', async () => {
            const result = await filesModule.writeFile(testFile, 'New Content');
            expect(result.success).toBe(true);

            const content = await fs.readFile(testFile, 'utf-8');
            expect(content).toBe('New Content');
        });

        it('should overwrite existing file', async () => {
            await fs.writeFile(testFile, 'Old');
            await filesModule.writeFile(testFile, 'New');

            const content = await fs.readFile(testFile, 'utf-8');
            expect(content).toBe('New');
        });
    });

    describe('listDirectory', () => {
        it('should list files in directory', async () => {
            await fs.writeFile(path.join(testDir, 'file1.txt'), '');
            await fs.writeFile(path.join(testDir, 'file2.txt'), '');

            const items = await filesModule.listDirectory(testDir);
            expect(items.length).toBe(2);
            expect(items.some(i => i.name === 'file1.txt')).toBe(true);
        });

        it('should return empty for empty directory', async () => {
            const items = await filesModule.listDirectory(testDir);
            expect(items).toEqual([]);
        });
    });

    describe('searchFiles', () => {
        it('should find files by pattern', async () => {
            await fs.writeFile(path.join(testDir, 'test.js'), '');
            await fs.writeFile(path.join(testDir, 'test.py'), '');

            const files = await filesModule.searchFiles('*.js', testDir);
            expect(files.length).toBe(1);
            expect(files[0]).toContain('test.js');
        });
    });
});
