import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { executeHeadlessAgent } from './workerAgent.js';

class TaskRegistry {
    constructor() {
        this.tasks = new Map();
        this.persistencePath = path.join(process.cwd(), '.mylocalcli', 'tasks.json');
        this.load().catch(() => {});
    }

    async load() {
        try {
            const data = await fs.readFile(this.persistencePath, 'utf8');
            const parsed = JSON.parse(data);
            this.tasks = new Map(Object.entries(parsed));
        } catch (e) {
            this.tasks = new Map();
        }
    }

    async save() {
        try {
            await fs.mkdir(path.dirname(this.persistencePath), { recursive: true });
            const obj = Object.fromEntries(this.tasks);
            await fs.writeFile(this.persistencePath, JSON.stringify(obj, null, 2), 'utf8');
        } catch (e) {
            console.error('Failed to save task registry:', e);
        }
    }

    createTask(instruction, priority = 'normal') {
        const id = crypto.randomUUID().slice(0, 8);
        const task = {
            id,
            instruction,
            priority,
            status: 'pending',
            output: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.tasks.set(id, task);
        this.save();
        
        // Spawn background worker execution asynchronously without blocking
        this._runTaskInBackground(id, instruction);
        
        return task;
    }

    async _runTaskInBackground(id, instruction) {
        this.updateTask(id, 'running', 'Started processing in background...');
        try {
            const result = await executeHeadlessAgent(
                'You are a background worker agent. Complete the task using any tools necessary.',
                instruction,
                process.cwd(),
                (progress) => {
                    this.updateTask(id, 'running', progress);
                }
            );
            this.updateTask(id, 'completed', result);
        } catch (error) {
            this.updateTask(id, 'failed', `Error: ${error.message}`);
        }
    }

    getTask(id) {
        return this.tasks.get(id);
    }

    listTasks(statusFilter = null) {
        const allTasks = Array.from(this.tasks.values());
        if (statusFilter) {
            return allTasks.filter(t => t.status === statusFilter);
        }
        return allTasks;
    }

    stopTask(id) {
        const task = this.tasks.get(id);
        if (task && ['pending', 'running'].includes(task.status)) {
            task.status = 'stopped';
            task.updatedAt = new Date().toISOString();
            this.tasks.set(id, task);
            this.save();
            return true;
        }
        return false;
    }

    updateTask(id, status, outputAppend = '') {
        const task = this.tasks.get(id);
        if (task) {
            if (status) task.status = status;
            if (outputAppend) task.output += outputAppend + '\n';
            task.updatedAt = new Date().toISOString();
            this.tasks.set(id, task);
            this.save();
            return task;
        }
        return null;
    }
    
    getTaskOutput(id) {
        const task = this.tasks.get(id);
        return task ? task.output : null;
    }
}

// Global singleton instance matching claw-code registry pattern
export const taskRegistry = new TaskRegistry();
