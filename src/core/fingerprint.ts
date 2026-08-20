/**
 * Extract a structured "writing fingerprint" from a set of samples. This is
 * the deterministic half of a Voice Profile: sentence rhythm, punctuation
 * habits, pronoun stance, hedging, and characteristic vocabulary.
 */

import { detectIssues } from './rules.ts'
import {
  detectLanguage,
  isStopword,
  median,
  splitSentences,
  stddev,
  tokenize,
  wordCount,
  type Language,
} from './text.ts'

export interface SampleInput {
  text: string
  platform?: string
}

export interface TopToken {
  token: string
  count: number
}

export interface StyleFingerprint {
  language: Language
  sampleCount: number
  totalWords: number
  sentence: {
    avgLength: number
    medianLength: number
    /** Standard deviation of sentence lengths — rhythm / burstiness. */
    burstiness: number
    /** Fraction of sentences under 8 tokens (short-punch style). */
    shortRate: number
    /** Fraction of sentences over 28 tokens (long-run style). */
    longRate: number
  }
  punctuation: {
    emDash: number
    ellipsis: number
    semicolon: number
    colon: number
    parentheses: number
    exclamation: number
    question: number
  }
  stance: {
    firstPersonRate: number
    secondPersonRate: number
    hedgeRate: number
    transitionRate: number
    aiPhraseHits: number
    /** Adverbs (-ly, 然) per 100 tokens — higher reads more literary/AI. */
    adverbRate: number
    /** English contractions (don't, it's) per 100 tokens — higher reads more casual. */
    contractionRate: number
  }
  vocabulary: {
    typeTokenRatio: number
    topWords: TopToken[]
    topOpeners: TopToken[]
  }
  platforms: Record<string, number>
}

const EMPTY_PUNCTUATION = {
  emDash: 0,
  ellipsis: 0,
  semicolon: 0,
  colon: 0,
  parentheses: 0,
  exclamation: 0,
  question: 0,
}

function perHundred(count: number, tokens: number): number {
  if (tokens === 0) return 0
  return Math.round((count / tokens) * 10000) / 100
}

/** Count the tokens, most frequent non-stopword tokens, and CJK bigrams. */
function vocabularyStats(text: string): { typeTokenRatio: number; topWords: TopToken[] } {
  const tokens = tokenize(text)
  const freq = new Map<string, number>()
  for (const token of tokens) {
    if (isStopword(token)) continue
    if (/^\d+$/.test(token)) continue
    freq.set(token, (freq.get(token) ?? 0) + 1)
  }
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([token, count]) => ({ token, count }))
  const unique = freq.size
  return {
    typeTokenRatio: tokens.length ? Math.round((unique / tokens.length) * 1000) / 1000 : 0,
    topWords,
  }
}

/** Most common sentence-initial token (normalized). */
function openerStats(sentences: string[]): TopToken[] {
  const freq = new Map<string, number>()
  for (const s of sentences) {
    const first = s.split(/\s+/)[0] ?? ''
    const cleaned = first.replace(/^["'“”‘’([{\[\]})>]+/, '').replace(/[，,。.!！?？:：;；]+$/, '')
    if (!cleaned || cleaned.length < 2) continue
    const key = cleaned.toLowerCase()
    freq.set(key, (freq.get(key) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token, count]) => ({ token, count }))
}

export function extractFingerprint(samples: SampleInput[]): StyleFingerprint {
  const nonEmpty = samples.filter((s) => s.text.trim().length > 0)
  const corpus = nonEmpty.map((s) => s.text).join('\n\n')

  const sentences = splitSentences(corpus)
  const lengths = sentences.map((s) => wordCount(s))
  const totalWords = lengths.reduce((a, b) => a + b, 0)
  const avgLength = sentences.length ? totalWords / sentences.length : 0

  const shortRate = sentences.length ? lengths.filter((n) => n < 8).length / sentences.length : 0
  const longRate = sentences.length ? lengths.filter((n) => n > 28).length / sentences.length : 0

  // Punctuation counts, scaled to occurrences per 100 tokens.
  const emDash = (corpus.match(/—|--|–/g) ?? []).length
  const ellipsis = (corpus.match(/…|\.{3}/g) ?? []).length
  const semicolon = (corpus.match(/;/g) ?? []).length
  const colon = (corpus.match(/[:：]/g) ?? []).length
  const parentheses = (corpus.match(/[()（）]/g) ?? []).length
  const exclamation = (corpus.match(/[!！]/g) ?? []).length
  const question = (corpus.match(/[?？]/g) ?? []).length

  // Pronoun stance. CJK first/second person are measured via 我 / 你.
  const firstPersonEn = (corpus.match(/\b(I|me|my|we|our)\b/gi) ?? []).length
  const firstPersonZh = (corpus.match(/我|我们|咱/g) ?? []).length
  const secondPersonEn = (corpus.match(/\b(you|your)\b/gi) ?? []).length
  const secondPersonZh = (corpus.match(/你|你们|您/g) ?? []).length
  const firstPersonRate = perHundred(firstPersonEn + firstPersonZh, totalWords)
  const secondPersonRate = perHundred(secondPersonEn + secondPersonZh, totalWords)

  const issues = detectIssues(corpus)
  const hedgeRate = perHundred(
    issues.filter((i) => i.category === 'hedge').reduce((a, b) => a + b.count, 0),
    totalWords,
  )
  const transitionRate = perHundred(
    issues.filter((i) => i.category === 'transition').reduce((a, b) => a + b.count, 0),
    totalWords,
  )
  const aiPhraseHits = issues.reduce((a, b) => a + b.count, 0)

  // Adverbs (-ly in English, 然 suffix in Chinese) and English contractions.
  const adverbEn = (corpus.match(/\b\w+ly\b/gi) ?? []).length
  const adverbZh = (corpus.match(/然/g) ?? []).length
  const adverbRate = perHundred(adverbEn + adverbZh, totalWords)
  const contractionRate = perHundred(corpus.match(/\b\w+'(?:s|t|re|ve|ll|d|m)\b/gi)?.length ?? 0, totalWords)

  const vocab = vocabularyStats(corpus)

  const platforms: Record<string, number> = {}
  for (const s of nonEmpty) {
    const key = s.platform?.trim() || 'default'
    platforms[key] = (platforms[key] ?? 0) + 1
  }

  return {
    language: detectLanguage(corpus),
    sampleCount: nonEmpty.length,
    totalWords,
    sentence: {
      avgLength: Math.round(avgLength * 10) / 10,
      medianLength: Math.round(median(lengths) * 10) / 10,
      burstiness: Math.round(stddev(lengths) * 10) / 10,
      shortRate: Math.round(shortRate * 1000) / 1000,
      longRate: Math.round(longRate * 1000) / 1000,
    },
    punctuation: {
      emDash: perHundred(emDash, totalWords),
      ellipsis: perHundred(ellipsis, totalWords),
      semicolon: perHundred(semicolon, totalWords),
      colon: perHundred(colon, totalWords),
      parentheses: perHundred(parentheses, totalWords),
      exclamation: perHundred(exclamation, totalWords),
      question: perHundred(question, totalWords),
    },
    stance: {
      firstPersonRate,
      secondPersonRate,
      hedgeRate,
      transitionRate,
      aiPhraseHits,
      adverbRate,
      contractionRate,
    },
    vocabulary: {
      typeTokenRatio: vocab.typeTokenRatio,
      topWords: vocab.topWords,
      topOpeners: openerStats(sentences),
    },
    platforms,
  }
}

export const EMPTY_FINGERPRINT: StyleFingerprint = {
  language: 'en',
  sampleCount: 0,
  totalWords: 0,
  sentence: { avgLength: 0, medianLength: 0, burstiness: 0, shortRate: 0, longRate: 0 },
  punctuation: EMPTY_PUNCTUATION,
  stance: { firstPersonRate: 0, secondPersonRate: 0, hedgeRate: 0, transitionRate: 0, aiPhraseHits: 0, adverbRate: 0, contractionRate: 0 },
  vocabulary: { typeTokenRatio: 0, topWords: [], topOpeners: [] },
  platforms: {},
}
