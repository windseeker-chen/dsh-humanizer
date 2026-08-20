import assert from 'node:assert/strict'
import { test } from 'node:test'

import { detectLanguage, median, splitSentences, stddev, tokenize, wordCount } from '../src/core/text.ts'

test('splits sentences for English and Chinese', () => {
  assert.deepEqual(splitSentences('First sentence. Second one! Third?'), [
    'First sentence.',
    'Second one!',
    'Third?',
  ])
  assert.deepEqual(splitSentences('这是第一句。这是第二句！真的吗？'), ['这是第一句。', '这是第二句！', '真的吗？'])
})

test('keeps abbreviations and decimals intact', () => {
  assert.deepEqual(splitSentences('Dr. Smith went home. Then he left.'), [
    'Dr. Smith went home.',
    'Then he left.',
  ])
  assert.deepEqual(splitSentences('I paid 3.14 for pie. Nice.'), ['I paid 3.14 for pie.', 'Nice.'])
  assert.deepEqual(splitSentences('Use e.g. a comma. Or not.'), ['Use e.g. a comma.', 'Or not.'])
})

test('splits on closing quotes and ellipsis', () => {
  assert.deepEqual(splitSentences('He said "hello." Then left.'), ['He said "hello."', 'Then left.'])
  assert.ok(splitSentences('Wait… what?').length >= 2)
})

test('counts CJK chars and Latin words', () => {
  assert.equal(wordCount('hello world'), 2)
  assert.equal(wordCount('你好世界'), 4)
  assert.equal(wordCount('hello 世界'), 3)
})

test('detects language', () => {
  assert.equal(detectLanguage('hello world'), 'en')
  assert.equal(detectLanguage('你好世界'), 'zh')
  assert.equal(detectLanguage(''), 'en')
})

test('tokenizes Latin words and CJK bigrams', () => {
  const tokens = tokenize('hello 世界')
  assert.ok(tokens.includes('hello'))
  assert.ok(tokens.includes('世界'))
})

test('computes stddev and median', () => {
  assert.equal(stddev([2, 4, 4, 4, 5, 5, 7, 9]), 2)
  assert.equal(median([1, 2, 3]), 2)
  assert.equal(median([1, 2, 3, 4]), 2.5)
})
