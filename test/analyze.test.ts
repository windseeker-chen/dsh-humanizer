import assert from 'node:assert/strict'
import { test } from 'node:test'

import { analyzeText } from '../src/core/analyze.ts'

test('scores AI-heavy text higher than plain writing', () => {
  const ai = analyzeText(
    "In today's rapidly evolving landscape, it is important to note that AI unlocks the potential of seamless innovation. Furthermore, this is a game-changer. In conclusion, we must embrace this paradigm shift.",
  )
  const human = analyzeText('We shipped it Thursday. Three people, two weeks, one ugly hack. Customers noticed and churned less.')
  assert.ok(ai.aiScore > human.aiScore)
})

test('reports structured metrics', () => {
  const report = analyzeText('Short. Punchy. Direct. To the point. No fluff here at all.')
  assert.ok(report.aiScore >= 0 && report.aiScore <= 100)
  assert.equal(report.sentences, 5)
  assert.ok(report.words > 0)
  assert.ok(report.avgSentenceLength > 0)
})

test('sums issue counts', () => {
  const report = analyzeText('In conclusion, it is worth noting that synergy unlocks the potential.')
  assert.ok(report.issueCount > 0)
  assert.equal(report.issueCount, report.issues.reduce((a, b) => a + b.count, 0))
})

test('handles empty text', () => {
  const report = analyzeText('')
  assert.equal(report.sentences, 0)
  assert.equal(report.words, 0)
  assert.equal(report.aiScore, 0)
})
