/**
 * Language-neutral text primitives: sentence splitting, token counting, and
 * lightweight tokenization for both Latin and CJK text.
 */
/** Rough language classification for a blob of text. */
export type Language = 'zh' | 'en' | 'mixed';
export declare function detectLanguage(text: string): Language;
/** Count one CJK character as one token and one Latin word as one token. */
export declare function wordCount(text: string): number;
/**
 * Split a blob into sentences. Handles `。！？!?` (with optional closing
 * quotes) and `.` followed by whitespace or end-of-string, without breaking
 * abbreviations that end in a dot mid-word.
 */
export declare function splitSentences(text: string): string[];
/** Standard deviation of an array of numbers. */
export declare function stddev(values: number[]): number;
export declare function median(values: number[]): number;
/** Tokenize into Latin words and CJK bigrams, for vocabulary statistics. */
export declare function tokenize(text: string): string[];
export declare function isStopword(token: string): boolean;
