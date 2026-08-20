import type { Context } from '@deepseek-ai/cordis'
import type { JsonValue } from '@deepseek-ai/dsh-tools'
import { defineTool } from '@deepseek-ai/dsh-tools'
import {
  analyzeText,
  buildRewriteBrief,
  detectLanguage,
  extractFingerprint,
  renderFingerprint,
  scoreSimilarity,
  type SimilarityResult,
  type StyleFingerprint,
} from '@dsh/writing-core'
import { ProfileStore, type VoiceProfile } from './store.ts'

export type Strength = 'light' | 'standard' | 'aggressive'

export interface VoiceConfig {
  storagePath: string
  strength: Strength
  maxExcerpts: number
}

const STRENGTH_DESCRIPTION =
  'How aggressively to rewrite: "light" keeps wording, "standard" balances, "aggressive" restructures freely.'

export function registerVoiceTools(ctx: Context, config: VoiceConfig) {
  const store = new ProfileStore(config.storagePath)

  ctx.tools.register(
    defineTool({
      name: 'voice_import',
      description:
        'Import writing samples and build a reusable voice profile. Extracts a deterministic style fingerprint (sentence rhythm, punctuation habits, stance, preferred vocabulary) and persists it under a name for later rewriting.',
      parameters: {
        name: { type: 'string', required: true, description: 'Profile id, e.g. "me-x" or "me-newsletter".' },
        samples: {
          type: 'array',
          items: { type: 'string' },
          required: true,
          description: 'One or more texts you wrote (posts, emails, articles).',
        },
        platform: {
          type: 'string',
          description: 'Optional source channel label for all samples, e.g. "x", "wechat", "email".',
        },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => {
          const v = value as unknown as { id: string; sampleCount: number; fingerprint: StyleFingerprint }
          return [{ type: 'text', text: `Imported voice profile "${v.id}" (${v.sampleCount} samples).\n\n${renderFingerprint(v.fingerprint)}` }]
        },
      },
      async execute(args) {
        const samples = args.samples
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((text) => ({ text, platform: args.platform?.trim() || undefined }))
        if (!samples.length) throw new Error('Provide at least one non-empty sample.')

        const fingerprint = extractFingerprint(samples)
        const now = new Date().toISOString()
        const existing = await store.get(args.name)
        const profile: VoiceProfile = {
          id: args.name,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          sampleCount: samples.length,
          platforms: Object.keys(fingerprint.platforms),
          fingerprint,
          sampleExcerpts: samples.slice(0, config.maxExcerpts).map((s) => s.text.slice(0, 500)),
        }
        await store.upsert(profile)
        return { id: args.name, sampleCount: samples.length, fingerprint } as unknown as JsonValue
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'voice_profile',
      description:
        'Read a stored voice profile, or list all profiles when no name is given.',
      parameters: {
        name: { type: 'string', description: 'Profile id to read. Omit to list all profiles.' },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{ type: 'text', text: renderProfileValue(value as unknown as ProfileValue) }],
      },
      async execute(args) {
        if (!args.name) {
          const profiles = await store.list()
          const list = profiles.map((p) => ({
            id: p.id,
            sampleCount: p.sampleCount,
            updatedAt: p.updatedAt,
            platforms: p.platforms,
            language: p.fingerprint.language,
            avgSentenceLength: p.fingerprint.sentence.avgLength,
          }))
          return { profiles: list } as unknown as JsonValue
        }
        const profile = await store.get(args.name)
        if (!profile) throw new Error(`Voice profile "${args.name}" not found.`)
        return { profile } as unknown as JsonValue
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'voice_remove',
      description: 'Delete a stored voice profile by id.',
      parameters: {
        name: { type: 'string', required: true, description: 'Profile id to delete.' },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => {
          const v = value as unknown as { removed: boolean; id: string }
          return [{ type: 'text', text: v.removed ? `Removed voice profile "${v.id}".` : `Voice profile "${v.id}" not found.` }]
        },
      },
      async execute(args) {
        const removed = await store.remove(args.name)
        return { removed, id: args.name } as unknown as JsonValue
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'voice_score',
      description:
        'Score how closely a piece of text matches a stored voice profile. Returns a 0-100 similarity score plus a per-feature breakdown (sentence length, rhythm, punctuation, stance, vocabulary).',
      parameters: {
        text: { type: 'string', required: true, description: 'The text to score against the profile.' },
        name: { type: 'string', required: true, description: 'Profile id to compare against.' },
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{ type: 'text', text: renderScoreValue(value as unknown as ScoreValue) }],
      },
      async execute(args) {
        const profile = await store.get(args.name)
        if (!profile) throw new Error(`Voice profile "${args.name}" not found.`)
        const draft = extractFingerprint([{ text: args.text }])
        const result = scoreSimilarity(draft, profile.fingerprint)
        return { profileId: args.name, ...result } as unknown as JsonValue
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'voice_rewrite',
      description:
        'Return a rewrite brief that makes the given text read like the author of a stored voice profile (fingerprint + representative samples). Apply the returned brief yourself and output only the rewritten text.',
      parameters: {
        text: { type: 'string', required: true, description: 'The draft to rewrite.' },
        name: { type: 'string', required: true, description: 'Profile id whose voice to imitate.' },
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
        const profile = await store.get(args.name)
        if (!profile) throw new Error(`Voice profile "${args.name}" not found.`)

        const report = analyzeText(args.text)
        return buildRewriteBrief({
          report,
          strength: args.strength ?? config.strength,
          language: resolveLanguage(args.language, args.text),
          includeRules: false,
          fingerprint: profile.fingerprint,
          excerpts: profile.sampleExcerpts,
        })
      },
    }),
  )
}

function resolveLanguage(language: 'auto' | 'zh' | 'en' | undefined, text: string): string {
  if (language === 'zh') return 'Chinese'
  if (language === 'en') return 'English'
  return detectLanguage(text) === 'zh' ? 'Chinese' : 'English'
}

// ---- render helpers (pure functions of the canonical value) ----------

interface ProfileValue {
  profiles?: Array<{ id: string; sampleCount: number; updatedAt: string; platforms: string[]; language: string; avgSentenceLength: number }>
  profile?: VoiceProfile
}

function renderProfileValue(value: ProfileValue): string {
  if (value.profiles) {
    if (!value.profiles.length) return 'No voice profiles stored yet. Use voice_import to create one.'
    const lines = value.profiles.map((p) =>
      `- ${p.id} · ${p.sampleCount} samples · ${p.language} · avg sentence ${p.avgSentenceLength} · updated ${p.updatedAt}`,
    )
    return `Voice profiles:\n${lines.join('\n')}`
  }
  const p = value.profile
  if (!p) return 'No profile.'
  const header = `Voice profile "${p.id}" · ${p.sampleCount} samples · updated ${p.updatedAt}`
  return `${header}\n\n${renderFingerprint(p.fingerprint)}${p.sampleExcerpts.length ? `\n\nSamples kept for few-shot: ${p.sampleExcerpts.length}` : ''}`
}

type ScoreValue = SimilarityResult & { profileId?: string }

function renderScoreValue(value: ScoreValue): string {
  const lines = [`Voice similarity: ${value.score}/100${value.profileId ? ` (vs "${value.profileId}")` : ''}`, '']
  for (const f of value.features) {
    lines.push(`- ${f.feature}: ${Math.round(f.similarity * 100)}% (weight ${f.weight})`)
  }
  return lines.join('\n')
}
