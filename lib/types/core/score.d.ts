/**
 * Similarity scoring between a draft fingerprint and a stored Voice Profile.
 * Each feature produces a 0–1 similarity, weighted into a final 0–100 score.
 * Heuristic and transparent on purpose: the breakdown is part of the result.
 */
import type { StyleFingerprint } from './fingerprint.ts';
export interface ScoreFeature {
    feature: string;
    similarity: number;
    weight: number;
}
export interface SimilarityResult {
    score: number;
    features: ScoreFeature[];
}
export declare function scoreSimilarity(draft: StyleFingerprint, profile: StyleFingerprint): SimilarityResult;
