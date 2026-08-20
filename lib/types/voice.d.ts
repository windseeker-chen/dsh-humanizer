import type { Context } from '@deepseek-ai/cordis';
import { type Strength } from './humanizer.ts';
export interface VoiceConfig {
    storagePath: string;
    strength: Strength;
    maxExcerpts: number;
}
export declare function registerVoiceTools(ctx: Context, config: VoiceConfig): void;
