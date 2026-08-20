import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { registerVoiceTools, type Strength } from './tools.ts'

export const name = 'voice'
export const inject = ['tools']

export interface Config {
  /** Where voice profiles are persisted (JSON file, `~` expanded). */
  storagePath: string
  /** Default rewrite strength when `voice_rewrite` is called without one. */
  strength: Strength
  /** Number of representative samples kept in the profile for few-shot rewriting. */
  maxExcerpts: number
}

export const Config: Schema<Config> = Schema.object({
  storagePath: Schema.string().default('~/.dsh/voice-profiles.json'),
  strength: Schema.union(['light', 'standard', 'aggressive'] as const).default('standard'),
  maxExcerpts: Schema.natural().default(3).max(10),
})

export function apply(ctx: Context, config: Config) {
  registerVoiceTools(ctx, config)
}
