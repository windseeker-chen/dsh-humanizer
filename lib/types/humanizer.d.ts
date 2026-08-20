import type { Context } from '@deepseek-ai/cordis';
export type Strength = 'light' | 'standard' | 'aggressive';
export interface HumanizerConfig {
    strength: Strength;
}
export declare function registerHumanizerTools(ctx: Context, config: HumanizerConfig): void;
export declare function resolveLanguage(language: 'auto' | 'zh' | 'en' | undefined, text: string): string;
