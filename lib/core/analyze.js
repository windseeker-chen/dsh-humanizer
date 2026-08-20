/**
 * Deterministic "de-AI" scan: turn a blob of text into a structured report
 * with a 0–100 AI-ness score. Pure and side-effect free.
 */
import { detectIssues } from "./rules.js";
import { detectLanguage, splitSentences, stddev, wordCount } from "./text.js";
export function analyzeText(text) {
    const sentences = splitSentences(text);
    const lengths = sentences.map((s) => wordCount(s));
    const words = lengths.reduce((a, b) => a + b, 0);
    const avgSentenceLength = sentences.length ? words / sentences.length : 0;
    const burstiness = stddev(lengths);
    const issues = detectIssues(text);
    let aiScore = 0;
    for (const issue of issues) {
        aiScore += issue.severity * Math.min(issue.count, 5) * 2;
    }
    // Uniform rhythm is a classic tell: few very short / very long sentences.
    if (sentences.length > 4 && burstiness < 1.5)
        aiScore += 10;
    // Run-on averages read machine-generated.
    if (sentences.length > 3 && avgSentenceLength > 32)
        aiScore += 5;
    // No issues at all and varied rhythm → genuinely low.
    aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
    return {
        aiScore,
        language: detectLanguage(text),
        sentences: sentences.length,
        words,
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        burstiness: Math.round(burstiness * 10) / 10,
        issues,
        issueCount: issues.reduce((a, b) => a + b.count, 0),
    };
}
export function groupIssues(report) {
    const map = new Map();
    for (const issue of report.issues) {
        map.set(issue.category, (map.get(issue.category) ?? 0) + issue.count);
    }
    return [...map.entries()].map(([category, total]) => ({
        category,
        label: category,
        total,
    }));
}
