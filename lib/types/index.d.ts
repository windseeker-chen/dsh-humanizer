import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { type Strength } from './humanizer.ts';
export declare const name = "dsh-humanizer";
export declare const inject: string[];
export interface Config {
    /** Default rewrite strength when a `*_rewrite` tool is called without one. */
    strength: Strength;
    /** Where voice profiles are persisted (JSON file, `~` expanded). */
    storagePath: string;
    /** Number of representative samples kept per profile for few-shot rewriting. */
    maxExcerpts: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
