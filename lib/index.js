import Schema from '@deepseek-ai/schemastery';
import { registerHumanizerTools } from "./humanizer.js";
import { registerVoiceTools } from "./voice.js";
export const name = 'dsh-humanizer';
export const inject = ['tools'];
export const Config = Schema.object({
    strength: Schema.union(['light', 'standard', 'aggressive']).default('standard'),
    storagePath: Schema.string().default('~/.dsh/voice-profiles.json'),
    maxExcerpts: Schema.natural().default(3).max(10),
});
export function apply(ctx, config) {
    registerHumanizerTools(ctx, { strength: config.strength });
    registerVoiceTools(ctx, {
        storagePath: config.storagePath,
        strength: config.strength,
        maxExcerpts: config.maxExcerpts,
    });
}
