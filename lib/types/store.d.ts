/**
 * Persistent storage for Voice Profiles: a single JSON file under the user's
 * home directory. Deliberately decoupled from the harness storage subsystem so
 * the plugin boots with no storage backend requirement.
 */
import type { StyleFingerprint } from './core/index.ts';
export interface VoiceProfile {
    id: string;
    createdAt: string;
    updatedAt: string;
    sampleCount: number;
    platforms: string[];
    fingerprint: StyleFingerprint;
    sampleExcerpts: string[];
}
export declare class ProfileStore {
    private readonly filePath;
    private cache;
    constructor(filePath: string);
    private load;
    private save;
    list(): Promise<VoiceProfile[]>;
    get(id: string): Promise<VoiceProfile | undefined>;
    upsert(profile: VoiceProfile): Promise<VoiceProfile>;
    remove(id: string): Promise<boolean>;
}
