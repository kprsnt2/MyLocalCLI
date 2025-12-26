import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('skills', () => {
    let skillModule;

    beforeAll(async () => {
        skillModule = await import('../src/skills/skill.js');
        await skillModule.loadSkills(path.join(__dirname, '..'));
    });

    describe('loadSkills', () => {
        it('should load built-in skills', () => {
            const skills = skillModule.getAllSkills();
            expect(skills.length).toBeGreaterThan(0);
        });

        it('should include javascript skill', () => {
            const skill = skillModule.getSkill('javascript');
            expect(skill).toBeDefined();
            expect(skill.name).toBe('javascript');
            expect(skill.priority).toBe(100);
        });

        it('should include python skill', () => {
            const skill = skillModule.getSkill('python');
            expect(skill).toBeDefined();
            expect(skill.tags).toContain('language');
        });
    });

    describe('findMatchingSkills', () => {
        it('should match javascript files to javascript skill', () => {
            const matched = skillModule.findMatchingSkills(['src/index.js']);
            const names = matched.map(s => s.name);
            expect(names).toContain('javascript');
        });

        it('should match python files to python skill', () => {
            const matched = skillModule.findMatchingSkills(['src/app.py', 'requirements.txt']);
            const names = matched.map(s => s.name);
            expect(names).toContain('python');
        });

        it('should match react files to react skill', () => {
            const matched = skillModule.findMatchingSkills(['src/App.tsx']);
            const names = matched.map(s => s.name);
            expect(names).toContain('react');
        });

        it('should respect maxSkills option', () => {
            const matched = skillModule.findMatchingSkills(
                ['src/index.js', 'package.json', 'Dockerfile'],
                { maxSkills: 2 }
            );
            expect(matched.length).toBeLessThanOrEqual(2);
        });
    });

    describe('getSkillContext', () => {
        it('should generate context for matched files', () => {
            const context = skillModule.getSkillContext(['src/app.js']);
            expect(context).toContain('Best Practices');
        });

        it('should return empty string for no matches', () => {
            const context = skillModule.getSkillContext(['unknown.xyz']);
            expect(context).toBe('');
        });
    });

    describe('getSkillsByCategory', () => {
        it('should group skills by category', () => {
            const byCategory = skillModule.getSkillsByCategory();
            expect(byCategory).toHaveProperty('language');
            expect(byCategory).toHaveProperty('framework');
        });
    });

    describe('searchSkills', () => {
        it('should find skills by name', () => {
            const results = skillModule.searchSkills('javascript');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBe('javascript');
        });
    });

    describe('SKILL_CATEGORIES', () => {
        it('should define all categories', () => {
            const cats = skillModule.SKILL_CATEGORIES;
            expect(cats.LANGUAGE).toBe('language');
            expect(cats.FRAMEWORK).toBe('framework');
            expect(cats.DATABASE).toBe('database');
            expect(cats.DEVOPS).toBe('devops');
        });
    });
});
