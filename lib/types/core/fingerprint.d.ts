/**
 * Extract a structured "writing fingerprint" from a set of samples. This is
 * the deterministic half of a Voice Profile: sentence rhythm, punctuation
 * habits, pronoun stance, hedging, and characteristic vocabulary.
 */
import { type Language } from './text.ts';
export interface SampleInput {
    text: string;
    platform?: string;
}
export interface TopToken {
    token: string;
    count: number;
}
export interface StyleFingerprint {
    language: Language;
    sampleCount: number;
    totalWords: number;
    sentence: {
        avgLength: number;
        medianLength: number;
        /** Standard deviation of sentence lengths — rhythm / burstiness. */
        burstiness: number;
        /** Fraction of sentences under 8 tokens (short-punch style). */
        shortRate: number;
        /** Fraction of sentences over 28 tokens (long-run style). */
        longRate: number;
    };
    punctuation: {
        emDash: number;
        ellipsis: number;
        semicolon: number;
        colon: number;
        parentheses: number;
        exclamation: number;
        question: number;
    };
    stance: {
        firstPersonRate: number;
        secondPersonRate: number;
        hedgeRate: number;
        transitionRate: number;
        aiPhraseHits: number;
    };
    vocabulary: {
        typeTokenRatio: number;
        topWords: TopToken[];
        topOpeners: TopToken[];
    };
    platforms: Record<string, number>;
}
export declare function extractFingerprint(samples: SampleInput[]): StyleFingerprint;
export declare const EMPTY_FINGERPRINT: StyleFingerprint;
