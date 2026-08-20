import assert from 'node:assert/strict'
import { test } from 'node:test'

import { compilePattern, detectIssues, AI_RULES, RULE_CATEGORY_LABELS } from '../src/core/rules.ts'

test('detects English AI patterns', () => {
  const issues = detectIssues(
    "In today's fast-paced world, let's dive into the realm of AI. Furthermore, it is worth noting that this is a game-changer. In conclusion, AI will unlock the potential.",
  )
  assert.ok(issues.length > 0)
  const ids = new Set(issues.map((i) => i.ruleId))
  assert.ok(ids.has('empty-opener-en') || ids.has('cliche-en'))
})

test('detects Chinese AI patterns', () => {
  const issues = detectIssues('在这个快速发展的时代，众所周知，赋能是关键抓手。综上所述，让我们携手共创未来。')
  assert.ok(issues.length > 0)
  const cats = new Set(issues.map((i) => i.category))
  assert.ok(cats.has('empty-opener') || cats.has('cliche') || cats.has('summary-ending'))
})

test('compilePattern caches compiled regexes', () => {
  const a = compilePattern('delve into')
  const b = compilePattern('delve into')
  assert.strictEqual(a, b)
})

test('every rule has a category label', () => {
  for (const rule of AI_RULES) {
    assert.ok(RULE_CATEGORY_LABELS[rule.category], `missing label for ${rule.category}`)
    assert.ok(rule.severity >= 1 && rule.severity <= 3)
    assert.ok(rule.patterns.length > 0)
  }
})

test('returns empty array for clean text', () => {
  assert.deepEqual(detectIssues('I walked the dog after lunch.'), [])
})
