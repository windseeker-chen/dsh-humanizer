/**
 * Deterministic "de-AI" scan: turn a blob of text into a structured report
 * with a 0–100 AI-ness score. Pure and side-effect free.
 */
import { type Detection, type RuleCategory } from './rules.ts';
import { type Language } from './text.ts';
export interface HumanizeReport {
    /** 0–100; higher = more AI-sounding. */
    aiScore: number;
    language: Language;
    sentences: number;
    words: number;
    /** Average sentence length in tokens (CJK char / Latin word). */
    avgSentenceLength: number;
    /** Standard deviation of sentence lengths — the "burstiness" signal. */
    burstiness: number;
    issues: Detection[];
    issueCount: number;
}
export declare function analyzeText(text: string): HumanizeReport;
export interface IssueGroup {
    category: RuleCategory;
    label: string;
    total: number;
}
export declare function groupIssues(report: HumanizeReport): IssueGroup[];
