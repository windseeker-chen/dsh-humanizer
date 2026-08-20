/**
 * A curated catalogue of "AI-writing" patterns for both English and Chinese.
 * Modeled on stop-slop, blader/humanizer, and Humanizer-zh: the goal is a
 * transparent, editable rule set rather than a black box.
 *
 * Each rule lists regular-expression *sources* (compiled with `gi`), a
 * severity (1 = mild tell, 3 = strong tell), and a category.
 */
export type RuleCategory = 'empty-opener' | 'cliche' | 'hedge' | 'transition' | 'summary-ending' | 'mechanical-parallel' | 'over-explain';
export interface AiRule {
    readonly id: string;
    readonly category: RuleCategory;
    readonly severity: 1 | 2 | 3;
    readonly patterns: readonly string[];
    readonly note: string;
}
export declare const RULE_CATEGORY_LABELS: Record<RuleCategory, string>;
export declare const AI_RULES: readonly AiRule[];
/** Compile one pattern source into a global, case-insensitive regex. */
export declare function compilePattern(source: string): RegExp;
export interface Detection {
    readonly ruleId: string;
    readonly category: RuleCategory;
    readonly severity: 1 | 2 | 3;
    readonly phrase: string;
    readonly count: number;
}
/** Find every AI pattern in a blob of text, grouped by rule. */
export declare function detectIssues(text: string): Detection[];
