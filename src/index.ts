import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { registerHumanizerTools, type Strength } from './humanizer.ts'
import { registerVoiceTools } from './voice.ts'

export const name = 'dsh-humanizer'
export const inject = ['tools']

export interface Config {
  /** Default rewrite strength when a `*_rewrite` tool is called without one. */
  strength: Strength
  /** Where voice profiles are persisted (JSON file, `~` expanded). */
  storagePath: string
  /** Number of representative samples kept per profile for few-shot rewriting. */
  maxExcerpts: number
}

export const Config: Schema<Config> = Schema.object({
  strength: Schema.union(['light', 'standard', 'aggressive'] as const).default('standard'),
  storagePath: Schema.string().default('~/.dsh/voice-profiles.json'),
  maxExcerpts: Schema.natural().default(3).max(10),
})

export function apply(ctx: Context, config: Config) {
  registerHumanizerTools(ctx, { strength: config.strength })
  registerVoiceTools(ctx, {
    storagePath: config.storagePath,
    strength: config.strength,
    maxExcerpts: config.maxExcerpts,
  })
}
