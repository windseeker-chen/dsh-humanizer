/**
 * Persistent storage for Voice Profiles: a single JSON file under the user's
 * home directory. Deliberately decoupled from the harness storage subsystem so
 * the plugin boots with no storage backend requirement.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
function expandHome(path) {
    if (path === '~')
        return homedir();
    if (path.startsWith('~/'))
        return join(homedir(), path.slice(2));
    return path;
}
function emptyStore() {
    return { version: 1, profiles: {} };
}
export class ProfileStore {
    filePath;
    cache = null;
    constructor(filePath) {
        this.filePath = expandHome(filePath);
    }
    async load() {
        if (this.cache)
            return this.cache;
        try {
            const raw = await readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(raw);
            this.cache = parsed && parsed.version === 1 && parsed.profiles ? parsed : emptyStore();
        }
        catch (err) {
            if (err.code !== 'ENOENT')
                throw err;
            this.cache = emptyStore();
        }
        return this.cache;
    }
    async save() {
        const data = this.cache ?? emptyStore();
        await mkdir(dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.tmp`;
        await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
        await rename(tmp, this.filePath);
    }
    async list() {
        const data = await this.load();
        return Object.values(data.profiles).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async get(id) {
        const data = await this.load();
        return data.profiles[id];
    }
    async upsert(profile) {
        const data = await this.load();
        profile.updatedAt = new Date().toISOString();
        data.profiles[profile.id] = profile;
        await this.save();
        return profile;
    }
    async remove(id) {
        const data = await this.load();
        if (!data.profiles[id])
            return false;
        delete data.profiles[id];
        await this.save();
        return true;
    }
}
