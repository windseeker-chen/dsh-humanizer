import assert from 'node:assert/strict'
import { test } from 'node:test'

import { extractFingerprint } from '../src/core/fingerprint.ts'

test('produces a stable, populated shape', () => {
  const fp = extractFingerprint([
    { text: 'I like short lines. Real short. Punchy.', platform: 'x' },
    { text: 'I like short lines. Real short. Punchy. And sometimes a longer one that runs on for a while.' },
  ])
  assert.equal(fp.sampleCount, 2)
  assert.ok(fp.sentence.avgLength > 0)
  assert.ok(fp.totalWords > 0)
  assert.deepEqual(Object.keys(fp.platforms).sort(), ['default', 'x'])
  assert.equal(typeof fp.vocabulary.typeTokenRatio, 'number')
})

test('detects informal voice via contractions', () => {
  const casual = extractFingerprint([{ text: "Don't stop. I'll go. You're up next." }])
  const formal = extractFingerprint([{ text: 'Do not stop. I will go. You are up next.' }])
  assert.ok(casual.stance.contractionRate > formal.stance.contractionRate)
})

test('handles empty input gracefully', () => {
  const fp = extractFingerprint([])
  assert.equal(fp.sampleCount, 0)
  assert.equal(fp.totalWords, 0)
  assert.deepEqual(fp.vocabulary.topWords, [])
})

test('records preferred vocabulary and openers', () => {
  const fp = extractFingerprint([
    { text: 'Widgets scale. Widgets ship. Widgets win. Widgets are the point. Widgets, always.' },
  ])
  assert.ok(fp.vocabulary.topWords.some((w) => w.token === 'widgets'))
  assert.ok(fp.vocabulary.topOpeners.length > 0)
})
