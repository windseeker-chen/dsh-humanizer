/**
 * Language-neutral text primitives: sentence splitting, token counting, and
 * lightweight tokenization for both Latin and CJK text.
 */

const CJK_RE = /[\u3400-\u9fff]/g

const LATIN_WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g

/** Rough language classification for a blob of text. */
export type Language = 'zh' | 'en' | 'mixed'

export function detectLanguage(text: string): Language {
  const cjk = (text.match(CJK_RE) ?? []).length
  const latin = (text.match(/[A-Za-z]/g) ?? []).length
  const total = cjk + latin
  if (total === 0) return 'en'
  if (cjk === 0) return 'en'
  if (latin === 0) return 'zh'
  return cjk / total > 0.6 ? 'zh' : 'mixed'
}

/** Count one CJK character as one token and one Latin word as one token. */
export function wordCount(text: string): number {
  const cjk = (text.match(CJK_RE) ?? []).length
  const latin = (text.match(LATIN_WORD_RE) ?? []).length
  return cjk + latin
}

/**
 * Split a blob into sentences. Handles `。！？!?` (with optional closing
 * quotes) and `.` followed by whitespace or end-of-string, without breaking
 * abbreviations such as "Dr." / "e.g." / "3.14".
 */
export function splitSentences(text: string): string[] {
  let s = text
  // Protect honorifics and common abbreviations so "Dr. Smith" stays whole.
  s = s.replace(/\b((?:dr|mr|mrs|ms|prof|sr|jr|st|vs|etc|no)\.)(?=\s+[A-Z])/gi, (m) =>
    m.replace(/\./g, '\u0000'),
  )
  // Protect "e.g." / "i.e." anywhere they are followed by whitespace.
  s = s.replace(/\b(e\.g\.|i\.e\.)(?=\s)/gi, (m) => m.replace(/\./g, '\u0000'))

  const normalized = s
    // CJK full-width stops always end a sentence, optionally followed by a closing quote.
    .replace(/([。！？]+)(["'”’」』）\)\]]*)/g, '$1$2\n')
    // ASCII ! ? end a sentence before whitespace/end or a closing quote + whitespace/end.
    .replace(/([!?]+)(["'”’」』\)\]]*)(?=\s+|$)/g, '$1$2\n')
    // ASCII period ends a sentence before whitespace/end (leaves decimals intact).
    .replace(/\.(?=\s+|$)/g, '.\n')
    // Ellipsis as a sentence boundary.
    .replace(/…{2,}/g, '$&\n')
    // Restore protected abbreviation dots.
    .replace(/\u0000/g, '.')

  return normalized
    .split(/\n+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
}

/** Standard deviation of an array of numbers. */
export function stddev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

/** Tokenize into Latin words and CJK bigrams, for vocabulary statistics. */
export function tokenize(text: string): string[] {
  const tokens: string[] = []
  const words = text.match(LATIN_WORD_RE) ?? []
  for (const w of words) {
    if (w.length >= 2) tokens.push(w.toLowerCase())
  }

  // CJK bigrams over the CJK-only skeleton of the text.
  const cjkOnly = (text.match(/[\u3400-\u9fff]+/g) ?? []).join('')
  for (let i = 0; i < cjkOnly.length - 1; i++) {
    tokens.push(cjkOnly.slice(i, i + 2))
  }
  return tokens
}

const EN_STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'for', 'are', 'was', 'were', 'have',
  'has', 'had', 'not', 'but', 'from', 'they', 'you', 'your', 'will', 'would',
  'can', 'could', 'should', 'about', 'into', 'than', 'then', 'them', 'these',
  'those', 'also', 'when', 'what', 'which', 'who', 'whom', 'there', 'here',
  'been', 'being', 'just', 'more', 'most', 'some', 'such', 'only', 'very',
])

export function isStopword(token: string): boolean {
  return EN_STOPWORDS.has(token)
}
