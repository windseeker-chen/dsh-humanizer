/**
 * Similarity scoring between a draft fingerprint and a stored Voice Profile.
 * Each feature produces a 0–1 similarity, weighted into a final 0–100 score.
 * Heuristic and transparent on purpose: the breakdown is part of the result.
 */
function close(a, b, tolerance) {
    const diff = Math.abs(a - b);
    if (diff <= tolerance)
        return 1;
    // Linear decay: 1.0 at tolerance, 0.0 at 4x tolerance.
    return Math.max(0, 1 - (diff - tolerance) / (3 * tolerance));
}
function cosine(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (const k of keys) {
        const va = a[k] ?? 0;
        const vb = b[k] ?? 0;
        dot += va * vb;
        na += va * va;
        nb += vb * vb;
    }
    if (na === 0 || nb === 0)
        return na === nb ? 1 : 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function topOverlap(a, b) {
    if (!a.length || !b.length)
        return 0;
    const setB = new Set(b.map((t) => t.token));
    const hit = a.filter((t) => setB.has(t.token)).length;
    return hit / Math.min(a.length, b.length);
}
export function scoreSimilarity(draft, profile) {
    const p = profile.sentence;
    const d = draft.sentence;
    const features = [
        {
            feature: 'sentence-length',
            similarity: close(d.avgLength, p.avgLength, 2),
            weight: 0.2,
        },
        {
            feature: 'rhythm-burstiness',
            similarity: close(d.burstiness, p.burstiness, 1.5),
            weight: 0.2,
        },
        {
            feature: 'punctuation-habits',
            similarity: cosine(draft.punctuation, profile.punctuation),
            weight: 0.15,
        },
        {
            feature: 'stance',
            similarity: (close(draft.stance.firstPersonRate, profile.stance.firstPersonRate, 1) +
                close(draft.stance.hedgeRate, profile.stance.hedgeRate, 0.5)) /
                2,
            weight: 0.15,
        },
        {
            feature: 'vocabulary-overlap',
            similarity: topOverlap(draft.vocabulary.topWords, profile.vocabulary.topWords),
            weight: 0.15,
        },
        {
            feature: 'sentence-length-spread',
            similarity: (close(d.shortRate, p.shortRate, 0.1) + close(d.longRate, p.longRate, 0.05)) / 2,
            weight: 0.15,
        },
    ];
    const score = Math.round(features.reduce((a, f) => a + f.similarity * f.weight, 0) * 100);
    return {
        score: Math.max(0, Math.min(100, score)),
        features: features.map((f) => ({ ...f, similarity: Math.round(f.similarity * 1000) / 1000 })),
    };
}
