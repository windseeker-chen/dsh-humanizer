/**
 * Render analysis results and build rewrite briefs for the agent to apply.
 * The plugins never call the LLM themselves: they hand the agent a brief,
 * and the agent performs the rewrite in its own turn.
 */
import { AI_RULES, RULE_CATEGORY_LABELS } from "./rules.js";
export function renderReport(report) {
    const lines = [];
    lines.push(`AI score: ${report.aiScore}/100 (higher = more AI-like)`);
    lines.push(`Language: ${report.language} · sentences: ${report.sentences} · words: ${report.words}`);
    lines.push(`Avg sentence length: ${report.avgSentenceLength} · burstiness: ${report.burstiness}`);
    if (!report.issues.length) {
        lines.push('No AI patterns detected.');
        return lines.join('\n');
    }
    lines.push('');
    lines.push('Detected patterns:');
    for (const issue of report.issues) {
        lines.push(`- [${RULE_CATEGORY_LABELS[issue.category]} / ${issue.severity}] "${issue.phrase}" ×${issue.count}`);
    }
    return lines.join('\n');
}
export function renderRules() {
    const lines = ['AI-writing rules (severity 1 = mild, 3 = strong):', ''];
    for (const rule of AI_RULES) {
        lines.push(`## ${RULE_CATEGORY_LABELS[rule.category]} — ${rule.id} (${rule.severity})`);
        lines.push(rule.note);
        for (const p of rule.patterns)
            lines.push(`- ${p}`);
        lines.push('');
    }
    return lines.join('\n');
}
export function renderFingerprint(fp) {
    const lines = [];
    lines.push(`Language: ${fp.language} · samples: ${fp.sampleCount} · words: ${fp.totalWords}`);
    lines.push(`Sentence: avg ${fp.sentence.avgLength}, median ${fp.sentence.medianLength}, burstiness ${fp.sentence.burstiness}, short ${Math.round(fp.sentence.shortRate * 100)}%, long ${Math.round(fp.sentence.longRate * 100)}%`);
    lines.push(`Punctuation (per 100 tokens): em-dash ${fp.punctuation.emDash}, ellipsis ${fp.punctuation.ellipsis}, semicolon ${fp.punctuation.semicolon}, colon ${fp.punctuation.colon}, parens ${fp.punctuation.parentheses}, ! ${fp.punctuation.exclamation}, ? ${fp.punctuation.question}`);
    lines.push(`Stance: first-person ${fp.stance.firstPersonRate}%, second-person ${fp.stance.secondPersonRate}%, hedge ${fp.stance.hedgeRate}, transition ${fp.stance.transitionRate}, AI-phrase hits ${fp.stance.aiPhraseHits}`);
    lines.push(`Type-token ratio: ${fp.vocabulary.typeTokenRatio}`);
    if (fp.vocabulary.topWords.length) {
        lines.push(`Top words: ${fp.vocabulary.topWords.map((w) => w.token).join(', ')}`);
    }
    if (fp.vocabulary.topOpeners.length) {
        lines.push(`Top openers: ${fp.vocabulary.topOpeners.map((w) => w.token).join(', ')}`);
    }
    const platforms = Object.entries(fp.platforms);
    if (platforms.length) {
        lines.push(`Platforms: ${platforms.map(([k, v]) => `${k}×${v}`).join(', ')}`);
    }
    return lines.join('\n');
}
const STRENGTH_GUIDANCE = {
    light: 'Make only minimal changes: remove the most obvious AI tells while preserving the original wording and structure.',
    standard: 'Rewrite naturally: remove AI patterns, vary rhythm, and keep every fact and figure intact.',
    aggressive: 'Rewrite freely: heavy de-AI edit. Restructure sentences, cut fluff, and keep only the substance and any facts, numbers, and citations.',
};
function fingerprintSection(fp) {
    if (!fp)
        return '';
    return [
        '## Target voice profile',
        'Rewrite to match these writing habits:',
        `- Sentence length: average ${fp.sentence.avgLength} tokens, median ${fp.sentence.medianLength}; rhythm (burstiness) ${fp.sentence.burstiness}; about ${Math.round(fp.sentence.shortRate * 100)}% short sentences, ${Math.round(fp.sentence.longRate * 100)}% long.`,
        `- Punctuation habits per 100 tokens: em-dash ${fp.punctuation.emDash}, ellipsis ${fp.punctuation.ellipsis}, semicolon ${fp.punctuation.semicolon}, colon ${fp.punctuation.colon}, parentheses ${fp.punctuation.parentheses}, exclamation ${fp.punctuation.exclamation}, question ${fp.punctuation.question}.`,
        `- Stance: first-person ${fp.stance.firstPersonRate}%, second-person ${fp.stance.secondPersonRate}%, hedging ${fp.stance.hedgeRate}, transitions ${fp.stance.transitionRate}.`,
        `- Preferred vocabulary: ${fp.vocabulary.topWords.map((w) => w.token).join(', ') || '(none recorded)'}.`,
        `- Sentence openers often start with: ${fp.vocabulary.topOpeners.map((w) => w.token).join(', ') || '(none recorded)'}.`,
        '',
    ].join('\n');
}
function excerptsSection(excerpts) {
    if (!excerpts || !excerpts.length)
        return '';
    return [
        '## Representative samples (imitate style, never copy content)',
        ...excerpts.map((e, i) => `Sample ${i + 1}:\n${e}`),
        '',
    ].join('\n');
}
export function buildRewriteBrief(opts) {
    const lines = [];
    lines.push('Rewrite the draft yourself, following the guidance below. Do not call another tool to rewrite.');
    lines.push('');
    lines.push(STRENGTH_GUIDANCE[opts.strength]);
    if (opts.language) {
        lines.push(`Write in ${opts.language}.`);
    }
    lines.push('');
    lines.push('## Hard rules');
    lines.push('- Preserve all facts, numbers, names, quotes, and citations exactly.');
    lines.push('- Do not add new claims, examples, or data.');
    lines.push('- Keep the original meaning and intended audience.');
    lines.push('- Remove: empty openers, mechanical parallelism, summary endings, hedging filler, and template transitions.');
    lines.push('- Vary sentence length; prefer concrete, specific wording over vague grand claims.');
    lines.push('');
    if (opts.report) {
        lines.push('## Issues detected in the draft');
        lines.push(`AI score: ${opts.report.aiScore}/100 · ${opts.report.issueCount} pattern hit(s).`);
        for (const issue of opts.report.issues) {
            lines.push(`- [${RULE_CATEGORY_LABELS[issue.category]}] "${issue.phrase}" ×${issue.count}`);
        }
        lines.push('');
    }
    const fp = fingerprintSection(opts.fingerprint);
    if (fp)
        lines.push(fp);
    const ex = excerptsSection(opts.excerpts);
    if (ex)
        lines.push(ex);
    if (opts.includeRules) {
        lines.push('## Reference: AI patterns to avoid');
        for (const rule of AI_RULES) {
            lines.push(`- [${RULE_CATEGORY_LABELS[rule.category]}] ${rule.patterns.join(' | ')}`);
        }
        lines.push('');
    }
    lines.push('## Output');
    lines.push('Output ONLY the rewritten text. No commentary, no preamble, no wrapping.');
    return lines.join('\n');
}
