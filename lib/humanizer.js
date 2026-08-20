import { defineTool } from '@deepseek-ai/dsh-tools';
import { analyzeText, buildRewriteBrief, detectLanguage, renderReport, renderRules, } from "./core/index.js";
const STRENGTH_DESCRIPTION = 'How aggressively to rewrite: "light" keeps wording, "standard" balances, "aggressive" restructures freely.';
export function registerHumanizerTools(ctx, config) {
    ctx.tools.register(defineTool({
        name: 'humanize_scan',
        description: 'Scan text for AI-writing patterns and return an AI-ness score (0-100, higher = more AI) plus detected issues: empty openers, clichés, hedging, template transitions, mechanical parallelism, summary endings.',
        parameters: {
            text: { type: 'string', required: true, description: 'The text to scan.' },
        },
        output: {
            schema: { type: 'json' },
            render: (_args, value) => [{ type: 'text', text: renderReport(value) }],
        },
        async execute(args) {
            return analyzeText(args.text);
        },
    }));
    ctx.tools.register(defineTool({
        name: 'humanize_rules',
        description: 'Return the full catalogue of AI-writing patterns this plugin detects, for transparency or to guide a manual rewrite.',
        parameters: {},
        output: {
            schema: { type: 'string' },
            render: (_args, value) => [{ type: 'text', text: value }],
        },
        async execute() {
            return renderRules();
        },
    }));
    ctx.tools.register(defineTool({
        name: 'humanize_rewrite',
        description: 'Return a rewrite brief for removing AI-writing patterns from the given text. Apply the returned brief yourself and output only the rewritten text. Preserves all facts, numbers, names and citations.',
        parameters: {
            text: { type: 'string', required: true, description: 'The text to rewrite.' },
            strength: {
                type: 'string',
                enum: ['light', 'standard', 'aggressive'],
                description: STRENGTH_DESCRIPTION,
            },
            language: {
                type: 'string',
                enum: ['auto', 'zh', 'en'],
                description: 'Output language. "auto" detects from the input.',
            },
        },
        output: {
            schema: { type: 'string' },
            render: (_args, value) => [{ type: 'text', text: value }],
        },
        async execute(args) {
            const report = analyzeText(args.text);
            return buildRewriteBrief({
                report,
                strength: args.strength ?? config.strength,
                language: resolveLanguage(args.language, args.text),
                includeRules: true,
            });
        },
    }));
}
export function resolveLanguage(language, text) {
    if (language === 'zh')
        return 'Chinese';
    if (language === 'en')
        return 'English';
    return detectLanguage(text) === 'zh' ? 'Chinese' : 'English';
}
