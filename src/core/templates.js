// MyLocalCLI - Project Templates System
// Initialize projects with predefined configurations

import fs from 'fs/promises';
import path from 'path';
import { printSuccess, printError, printInfo, colors } from '../ui/terminal.js';

/**
 * Project templates
 */
export const TEMPLATES = {
    react: {
        name: 'React',
        description: 'React application with TypeScript',
        icon: '⚛️',
        config: `---
name: "React Project"
description: "React application configuration"
---

# React Project Guidelines

## Code Style
- Use functional components with hooks
- Prefer TypeScript for type safety
- Follow React best practices

## File Structure
- Components in /src/components
- Pages in /src/pages
- Hooks in /src/hooks
- Utils in /src/utils

## Testing
- Use React Testing Library
- Test user interactions, not implementation
- Aim for 80%+ coverage

## Performance
- Use React.memo for expensive components
- Lazy load routes with React.lazy
- Optimize re-renders with useMemo/useCallback
`,
        skills: ['react', 'javascript', 'testing'],
        globs: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js']
    },

    'python-api': {
        name: 'Python API',
        description: 'Python FastAPI or Flask backend',
        icon: '🐍',
        config: `---
name: "Python API"
description: "Python backend configuration"
---

# Python API Guidelines

## Code Style
- Follow PEP 8
- Use type hints
- Document with docstrings

## Structure
- Routes in /app/routes
- Models in /app/models
- Services in /app/services
- Utils in /app/utils

## Testing
- Use pytest
- Mock external services
- Test edge cases

## Security
- Validate all inputs
- Use parameterized queries
- Never expose secrets
`,
        skills: ['python', 'fastapi', 'security'],
        globs: ['**/*.py']
    },

    node: {
        name: 'Node.js',
        description: 'Node.js application',
        icon: '🟢',
        config: `---
name: "Node.js Project"
description: "Node.js application configuration"
---

# Node.js Guidelines

## Code Style
- Use ES modules (import/export)
- Prefer async/await over callbacks
- Use meaningful variable names

## Structure
- Entry in /src/index.js
- Routes in /src/routes
- Controllers in /src/controllers
- Utils in /src/utils

## Error Handling
- Use try/catch with async/await
- Create custom error classes
- Log errors properly

## Testing
- Use Jest or Vitest
- Test both happy and error paths
`,
        skills: ['nodejs', 'javascript', 'testing'],
        globs: ['**/*.js', '**/*.mjs', '**/*.cjs']
    },

    nextjs: {
        name: 'Next.js',
        description: 'Next.js full-stack application',
        icon: '▲',
        config: `---
name: "Next.js Project"
description: "Next.js application configuration"
---

# Next.js Guidelines

## App Router
- Use app directory structure
- Server Components by default
- Client Components only when needed

## Data Fetching
- Use Server Components for static data
- Use Server Actions for mutations
- Cache appropriately

## Styling
- Use Tailwind CSS or CSS modules
- Keep styles colocated with components

## API Routes
- Use Route Handlers (app/api)
- Validate inputs
- Handle errors gracefully
`,
        skills: ['react', 'nextjs', 'javascript'],
        globs: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']
    },

    express: {
        name: 'Express.js',
        description: 'Express.js REST API',
        icon: '🚂',
        config: `---
name: "Express.js API"
description: "Express.js REST API configuration"
---

# Express.js Guidelines

## Structure
- Routes in /routes
- Controllers in /controllers
- Middleware in /middleware
- Models in /models

## Best Practices
- Use router.param for route params
- Validate with express-validator
- Use helmet for security
- Handle errors with middleware

## API Design
- Follow REST conventions
- Version your API (/api/v1)
- Return consistent responses
- Document with OpenAPI/Swagger
`,
        skills: ['express', 'nodejs', 'security'],
        globs: ['**/*.js', '**/*.ts']
    }
};

/**
 * Initialize project with template
 */
export async function initializeProject(templateName, cwd) {
    const template = TEMPLATES[templateName.toLowerCase()];
    if (!template) {
        return { success: false, error: `Unknown template: ${templateName}` };
    }

    const configDir = path.join(cwd, '.mylocalcli');
    const configPath = path.join(cwd, 'MYLOCALCLI.md');

    try {
        // Create .mylocalcli directory
        await fs.mkdir(configDir, { recursive: true });

        // Write config file
        await fs.writeFile(configPath, template.config);

        // Create skills directory and any template-specific skills
        const skillsDir = path.join(configDir, 'skills');
        await fs.mkdir(skillsDir, { recursive: true });

        return {
            success: true,
            template,
            configPath
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get template by name
 */
export function getTemplate(name) {
    return TEMPLATES[name.toLowerCase()] || null;
}

/**
 * Get all templates
 */
export function getAllTemplates() {
    return Object.values(TEMPLATES);
}

/**
 * Print templates list
 */
export function printTemplatesList() {
    console.log(`\n${colors.primary('━━━ Project Templates ━━━')}\n`);

    for (const [key, template] of Object.entries(TEMPLATES)) {
        console.log(`  ${template.icon} ${colors.secondary(key)}`);
        console.log(`     ${colors.muted(template.description)}`);
    }

    console.log();
    console.log(colors.muted('  Use /init <template> to initialize your project.'));
    console.log(colors.muted('  Example: /init react'));
    console.log();
}

export default {
    TEMPLATES,
    initializeProject,
    getTemplate,
    getAllTemplates,
    printTemplatesList
};
