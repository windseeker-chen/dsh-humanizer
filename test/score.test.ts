import assert from 'node:assert/strict'
import { test } from 'node:test'

import { extractFingerprint } from '../src/core/fingerprint.ts'
import { scoreSimilarity } from '../src/core/score.ts'

const profile = extractFingerprint([
  { text: 'Short lines. No filler. Direct, skeptical, a little dry. Em-dashes everywhere — why not. A question now and then?' },
])

test('scores matching style higher than mismatched', () => {
  const match = extractFingerprint([
    { text: 'Tight sentences. Dry humor. Another em-dash — see. Still no fluff. Right?' },
  ])
  const mismatch = extractFingerprint([
    { text: "In today's modern world, it is important to note that this comprehensive solution seamlessly unlocks the potential of a paradigm shift. Furthermore, we must embrace synergy. In conclusion, the journey begins." },
  ])
  assert.ok(scoreSimilarity(match, profile).score > scoreSimilarity(mismatch, profile).score)
})

test('identical text scores high', () => {
  const score = scoreSimilarity(profile, profile).score
  assert.ok(score >= 95, `expected >= 95, got ${score}`)
})

test('returns a per-feature breakdown', () => {
  const result = scoreSimilarity(extractFingerprint([{ text: 'Short. Direct.' }]), profile)
  assert.ok(result.score >= 0 && result.score <= 100)
  assert.ok(result.features.length >= 4)
  const weights = result.features.reduce((a, f) => a + f.weight, 0)
  assert.ok(Math.abs(weights - 1) < 0.001, `weights sum to ${weights}`)
  for (const f of result.features) {
    assert.ok(f.similarity >= 0 && f.similarity <= 1)
  }
})
