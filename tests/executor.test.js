import { describe, it, expect } from 'vitest';

describe('executor', () => {
    // Test with dynamic import to avoid mock issues
    let isDangerousCommand, isSafeCommand;

    beforeAll(async () => {
        const mod = await import('../src/core/executor.js');
        isDangerousCommand = mod.isDangerousCommand;
        isSafeCommand = mod.isSafeCommand;
    });

    describe('isDangerousCommand', () => {
        it('should detect rm -rf as dangerous', () => {
            expect(isDangerousCommand('rm -rf /')).toBe(true);
        });

        it('should detect del /s as dangerous', () => {
            expect(isDangerousCommand('del /s *.*')).toBe(true);
        });

        it('should detect format as dangerous', () => {
            expect(isDangerousCommand('format c:')).toBe(true);
        });

        it('should detect sudo as dangerous', () => {
            expect(isDangerousCommand('sudo rm -rf /')).toBe(true);
        });

        it('should not flag safe commands', () => {
            expect(isDangerousCommand('ls -la')).toBe(false);
            expect(isDangerousCommand('git status')).toBe(false);
            expect(isDangerousCommand('npm test')).toBe(false);
        });
    });

    describe('isSafeCommand', () => {
        it('should recognize ls as safe', () => {
            expect(isSafeCommand('ls -la')).toBe(true);
        });

        it('should recognize dir as safe', () => {
            expect(isSafeCommand('dir')).toBe(true);
        });

        it('should recognize git status as safe', () => {
            expect(isSafeCommand('git status')).toBe(true);
        });

        it('should recognize cat as safe', () => {
            expect(isSafeCommand('cat package.json')).toBe(true);
        });

        it('should not flag npm install as safe', () => {
            expect(isSafeCommand('npm install lodash')).toBe(false);
        });
    });
});
