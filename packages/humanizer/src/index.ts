import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { registerHumanizerTools, type Strength } from './tools.ts'

export const name = 'humanizer'
export const inject = ['tools']

export interface Config {
  /** Default rewrite strength when `humanize_rewrite` is called without one. */
  strength: Strength
}

export const Config: Schema<Config> = Schema.object({
  strength: Schema.union(['light', 'standard', 'aggressive'] as const).default('standard'),
})

export function apply(ctx: Context, config: Config) {
  registerHumanizerTools(ctx, config)
}
