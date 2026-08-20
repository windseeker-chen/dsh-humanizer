/**
 * Render analysis results and build rewrite briefs for the agent to apply.
 * The plugins never call the LLM themselves: they hand the agent a brief,
 * and the agent performs the rewrite in its own turn.
 */
import type { HumanizeReport } from './analyze.ts';
import type { StyleFingerprint } from './fingerprint.ts';
export declare function renderReport(report: HumanizeReport): string;
export declare function renderRules(): string;
export declare function renderFingerprint(fp: StyleFingerprint): string;
export interface RewriteBriefOptions {
    /** AI-pattern scan of the draft being rewritten (optional). */
    report?: HumanizeReport;
    fingerprint?: StyleFingerprint;
    excerpts?: string[];
    strength: 'light' | 'standard' | 'aggressive';
    language?: string;
    /** Include the full humanizer rule catalogue. */
    includeRules?: boolean;
}
export declare function buildRewriteBrief(opts: RewriteBriefOptions): string;
