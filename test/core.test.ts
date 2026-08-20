import assert from 'node:assert/strict'
import { test } from 'node:test'

import { analyzeText } from '../src/core/analyze.ts'
import { extractFingerprint } from '../src/core/fingerprint.ts'
import { scoreSimilarity } from '../src/core/score.ts'
import { splitSentences, wordCount } from '../src/core/text.ts'
import { detectIssues } from '../src/core/rules.ts'

test('splits sentences for English and Chinese', () => {
  const en = splitSentences('First sentence. Second one! Third?')
  assert.deepEqual(en, ['First sentence.', 'Second one!', 'Third?'])

  const zh = splitSentences('这是第一句。这是第二句！真的吗？')
  assert.deepEqual(zh, ['这是第一句。', '这是第二句！', '真的吗？'])
})

test('counts CJK chars and Latin words', () => {
  assert.equal(wordCount('hello world'), 2)
  assert.equal(wordCount('你好世界'), 4)
})

test('detects AI patterns', () => {
  const issues = detectIssues('In today’s fast-paced world, let’s dive into the realm of AI. Furthermore, it is worth noting that this is a game-changer. In conclusion, AI will unlock the potential.')
  assert.ok(issues.length > 0)
  const ids = new Set(issues.map((i) => i.ruleId))
  assert.ok(ids.has('empty-opener-en') || ids.has('cliche-en'))
})

test('analyzeText scores AI-heavy text higher', () => {
  const ai = analyzeText(
    'In today’s rapidly evolving landscape, it is important to note that AI unlocks the potential of seamless innovation. Furthermore, this is a game-changer. In conclusion, we must embrace this paradigm shift.',
  )
  const human = analyzeText('We shipped it Thursday. Three people, two weeks, one ugly hack. Customers noticed and churned less.')
  assert.ok(ai.aiScore > human.aiScore)
})

test('extractFingerprint produces a stable shape', () => {
  const fp = extractFingerprint([
    { text: 'I like short lines. Real short. Punchy.', platform: 'x' },
    { text: 'I like short lines. Real short. Punchy. And sometimes a longer one that runs on for a while.' },
  ])
  assert.equal(fp.sampleCount, 2)
  assert.ok(fp.sentence.avgLength > 0)
  assert.ok(fp.totalWords > 0)
  assert.deepEqual(Object.keys(fp.platforms).sort(), ['default', 'x'])
})

test('scoreSimilarity is higher for matching styles', () => {
  const profile = extractFingerprint([
    { text: 'Short lines. No filler. Direct, skeptical, a little dry. Em-dashes everywhere — why not. A question now and then?' },
  ])
  const match = extractFingerprint([
    { text: 'Tight sentences. Dry humor. Another em-dash — see. Still no fluff. Right?' },
  ])
  const mismatch = extractFingerprint([
    { text: 'In today’s modern world, it is important to note that this comprehensive solution seamlessly unlocks the potential of a paradigm shift. Furthermore, we must embrace synergy. In conclusion, the journey begins.' },
  ])
  const m = scoreSimilarity(match, profile).score
  const x = scoreSimilarity(mismatch, profile).score
  assert.ok(m > x, `expected ${m} > ${x}`)
})
