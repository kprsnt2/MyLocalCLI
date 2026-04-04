import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { executeHeadlessAgent } from './workerAgent.js';

class TeamRegistry {
    constructor() {
        this.teams = new Map();
        this.persistencePath = path.join(process.cwd(), '.mylocalcli', 'teams.json');
        this.load().catch(() => {});
    }

    async load() {
        try {
            const data = await fs.readFile(this.persistencePath, 'utf8');
            const parsed = JSON.parse(data);
            this.teams = new Map(Object.entries(parsed));
        } catch (e) {}
    }

    async save() {
        try {
            await fs.mkdir(path.dirname(this.persistencePath), { recursive: true });
            await fs.writeFile(this.persistencePath, JSON.stringify(Object.fromEntries(this.teams), null, 2), 'utf8');
        } catch (e) {}
    }

    createTeam(name, members, purpose) {
        const id = crypto.randomUUID().slice(0, 8);
        const team = {
            id, name, members: Array.isArray(members) ? members : [members], purpose,
            createdAt: new Date().toISOString()
        };
        this.teams.set(id, team);
        this.save();
        return team;
    }

    deleteTeam(id) {
        const result = this.teams.delete(id);
        if (result) this.save();
        return result;
    }

    listTeams() {
        return Array.from(this.teams.values());
    }
}

class CronRegistry {
    constructor() {
        this.jobs = new Map();
        this.persistencePath = path.join(process.cwd(), '.mylocalcli', 'crons.json');
        this.load().then(() => this.startScheduler());
    }

    async load() {
        try {
            const data = await fs.readFile(this.persistencePath, 'utf8');
            const parsed = JSON.parse(data);
            this.jobs = new Map(Object.entries(parsed));
        } catch (e) {}
    }

    async save() {
        try {
            await fs.mkdir(path.dirname(this.persistencePath), { recursive: true });
            await fs.writeFile(this.persistencePath, JSON.stringify(Object.fromEntries(this.jobs), null, 2), 'utf8');
        } catch (e) {}
    }

    createCron(schedule, command, description) {
        const id = crypto.randomUUID().slice(0, 8);
        const job = {
            id, schedule, command, description, active: true,
            lastRun: null,
            createdAt: new Date().toISOString()
        };
        this.jobs.set(id, job);
        this.save();
        return job;
    }

    deleteCron(id) {
        const job = this.jobs.get(id);
        if (job) {
            job.active = false;
            this.jobs.delete(id);
            this.save();
            return true;
        }
        return false;
    }

    listCrons() {
        return Array.from(this.jobs.values());
    }

    startScheduler() {
        // Simple mock scheduler - runs active crons every 60 seconds
        setInterval(() => {
            for (const [id, job] of this.jobs.entries()) {
                if (job.active) {
                    this._runJob(job);
                }
            }
        }, 60000);
    }

    async _runJob(job) {
        job.lastRun = new Date().toISOString();
        this.save();
        try {
            await executeHeadlessAgent(
                'You are a Cron worker agent. Execute the requested cron job command.',
                job.command,
                process.cwd()
            );
        } catch (error) {
            console.error(`Cron ${job.id} failed:`, error.message);
        }
    }
}

export const teamRegistry = new TeamRegistry();
export const cronRegistry = new CronRegistry();
