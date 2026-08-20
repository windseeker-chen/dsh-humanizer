/**
 * A curated catalogue of "AI-writing" patterns for both English and Chinese.
 * Modeled on stop-slop, blader/humanizer, and Humanizer-zh: the goal is a
 * transparent, editable rule set rather than a black box.
 *
 * Each rule lists regular-expression *sources* (compiled with `gi`), a
 * severity (1 = mild tell, 3 = strong tell), and a category.
 */

export type RuleCategory =
  | 'empty-opener'
  | 'cliche'
  | 'hedge'
  | 'transition'
  | 'summary-ending'
  | 'mechanical-parallel'
  | 'over-explain'

export interface AiRule {
  readonly id: string
  readonly category: RuleCategory
  readonly severity: 1 | 2 | 3
  readonly patterns: readonly string[]
  readonly note: string
}

export const RULE_CATEGORY_LABELS: Record<RuleCategory, string> = {
  'empty-opener': 'Empty opener',
  cliche: 'AI cliché',
  hedge: 'Hedging / qualifying',
  transition: 'Template transition',
  'summary-ending': 'Summary-style ending',
  'mechanical-parallel': 'Mechanical parallelism',
  'over-explain': 'Over-explaining',
}

export const AI_RULES: readonly AiRule[] = [
  // ---- empty openers -------------------------------------------------
  {
    id: 'empty-opener-en',
    category: 'empty-opener',
    severity: 3,
    note: 'Leads with a scene-setting formula instead of the actual point.',
    patterns: [
      "in today's",
      "in the modern world",
      "in the ever-evolving world",
      "in the fast-paced world",
      "in the rapidly evolving landscape",
      "in recent years",
      "in this day and age",
      "in the digital age",
      "it is important to note that",
      "it is worth noting that",
      "it is worth mentioning that",
      "it's no secret that",
      "let's dive",
      "without further ado",
      "as we all know",
      "it goes without saying that",
      "in the world of",
      "in an era of",
      "in an age of",
      "as technology continues to evolve",
      "with the advent of",
      "in the age of ai",
      "in the modern era",
    ],
  },
  {
    id: 'empty-opener-zh',
    category: 'empty-opener',
    severity: 3,
    note: 'Time-and-place scene-setting opener before the point. 中文式「时代背景开场」，先铺垫背景再进入正题。',
    patterns: [
      '在这个.{0,12}的时代',
      '随着.{0,16}的不断发展',
      '随着.{0,12}的进步',
      '在当今社会',
      '在当今这个',
      '近年来.{0,8}',
      '众所周知',
      '众所周知，',
      '不难发现',
      '显而易见',
      '众所周知地',
      '当今社会',
    ],
  },

  // ---- cliches -------------------------------------------------------
  {
    id: 'cliche-en',
    category: 'cliche',
    severity: 2,
    note: 'Overused AI vocabulary that marks text as generated.',
    patterns: [
      'delve into',
      'unlock the potential',
      'unleash',
      'game-changer',
      'game changer',
      'cutting-edge',
      'revolutionize',
      'revolutionary',
      'navigat(?:e|ing) the (?:complex|ever-changing|dynamic) landscape',
      'a testament to',
      'elevate your',
      'seamless',
      'seamlessly',
      'robust',
      'leverage',
      'synergy',
      'paradigm shift',
      'embark on',
      'realm of',
      'in the realm',
      'tapestry of',
      'unveil',
      'foster',
      'holistic',
      'actionable insights',
      'unlock',
      'groundbreaking',
      'state-of-the-art',
      'best-in-class',
      'world-class',
      'bleeding-edge',
      'next-generation',
      'scalable',
      'streamline',
      'supercharge',
      'pioneering',
    ],
  },
  {
    id: 'cliche-zh',
    category: 'cliche',
    severity: 2,
    note: 'Internet slang and inflated buzzwords that most loudly mark AI text. 互联网黑话与空洞拔高词，最容易暴露 AI 腔。',
    patterns: [
      '赋能',
      '抓手',
      '闭环',
      '底层逻辑',
      '顶层设计',
      '颗粒度',
      '对齐认知',
      '心智',
      '护城河',
      '天花板',
      '红利',
      '赛道',
      '生态位',
      '降维打击',
      '长期主义',
      '破圈',
      '拉满',
      '出圈',
      '弯道超车',
      '降本增效',
      '全链路',
      '私域',
      '公域',
      '增长黑客',
      '心智占领',
      '生态闭环',
      '垂类',
      '颗粒度对齐',
    ],
  },

  // ---- hedging -------------------------------------------------------
  {
    id: 'hedge-en',
    category: 'hedge',
    severity: 1,
    note: 'Hedge words that dilute the statement.',
    patterns: [
      'it is important to',
      'it is worth',
      'it should be noted',
      'one could argue',
      'arguably',
      'generally speaking',
      'to some extent',
      'somewhat',
      'in a sense',
      'potentially',
      'it can be said',
      'to be clear',
      'needless to say',
      "it's safe to say",
      'essentially',
      'basically',
    ],
  },
  {
    id: 'hedge-zh',
    category: 'hedge',
    severity: 1,
    note: 'Meaningless conservative qualifiers. 无意义的保守表述。',
    patterns: ['值得注意的是', '可以说', '某种程度上', '在一定程度上', '或许可以说', '大致而言', '总的来说', '一般来说', '基本上'],
  },

  // ---- transitions ---------------------------------------------------
  {
    id: 'transition-en',
    category: 'transition',
    severity: 2,
    note: 'Template connectives strung between paragraphs.',
    patterns: [
      '^furthermore,',
      '^moreover,',
      '^additionally,',
      '^in addition,',
      '^in conclusion,',
      '^in summary,',
      '^overall,',
      '^in essence,',
      '^ultimately,',
      '^in this regard,',
      '^on the other hand,',
      '^however,',
      '^therefore,',
      '^consequently,',
      '^thus,',
      '^as a result,',
    ],
  },
  {
    id: 'transition-zh',
    category: 'transition',
    severity: 2,
    note: 'Formulaic connectives. 形式化连接词。',
    patterns: ['^此外，', '^与此同时，', '^值得注意的是，', '^由此可见', '^毋庸置疑', '^换言之', '^换句话说', '^其次，', '^再次，', '^然后，', '^接着，'],
  },

  // ---- summary endings ----------------------------------------------
  {
    id: 'summary-ending-en',
    category: 'summary-ending',
    severity: 3,
    note: 'Restates everything in a closing paragraph.',
    patterns: [
      '^in conclusion',
      '^in summary',
      '^to sum up',
      '^in closing',
      '^all in all',
      '^as we can see',
      '^to conclude',
    ],
  },
  {
    id: 'summary-ending-zh',
    category: 'summary-ending',
    severity: 3,
    note: 'Summary-style ending and slogan close. 总结式结尾与口号式收束。',
    patterns: [
      '综上所述',
      '总而言之',
      '总的说来',
      '^总之',
      '^最后，',
      '^让我们',
      '希望通过',
      '让我们携手',
      '相信.{0,6}会更好',
      '说到底',
      '归根结底',
    ],
  },

  // ---- mechanical parallelism ---------------------------------------
  {
    id: 'mechanical-parallel-zh',
    category: 'mechanical-parallel',
    severity: 3,
    note: 'Mechanical parallel structure, lacking rhythm variation. 整齐排比句，缺乏节奏变化。',
    patterns: [
      '一方面.{0,20}另一方面',
      '首先.{0,30}其次.{0,30}再次',
      '不仅.{0,30}而且.{0,30}还',
      '一是.{0,20}二是.{0,20}三是',
    ],
  },

  // ---- over-explaining ----------------------------------------------
  {
    id: 'over-explain-en',
    category: 'over-explain',
    severity: 2,
    note: 'Explains what was just said a second time.',
    patterns: [
      'which means that',
      'in other words,',
      'that is to say',
      'what this means is',
      'the point here is',
      'this is because',
    ],
  },
  {
    id: 'over-explain-zh',
    category: 'over-explain',
    severity: 2,
    note: 'Re-explains the same point a second time. 重复解释同一意思。',
    patterns: ['也就是说，', '换句话说，', '说白了就是', '这就意味着', '其核心在于'],
  },
]

const compiledCache = new Map<string, RegExp>()

/** Compile one pattern source into a global, case-insensitive regex. */
export function compilePattern(source: string): RegExp {
  const cached = compiledCache.get(source)
  if (cached) return cached
  const re = new RegExp(source, 'gi')
  compiledCache.set(source, re)
  return re
}

export interface Detection {
  readonly ruleId: string
  readonly category: RuleCategory
  readonly severity: 1 | 2 | 3
  readonly phrase: string
  readonly count: number
}

/** Find every AI pattern in a blob of text, grouped by rule. */
export function detectIssues(text: string): Detection[] {
  const detections: Detection[] = []
  for (const rule of AI_RULES) {
    let count = 0
    let phrase = ''
    for (const source of rule.patterns) {
      const re = compilePattern(source)
      const matches = text.match(re)
      if (matches) {
        count += matches.length
        if (!phrase) phrase = matches[0]!.trim()
      }
    }
    if (count > 0) {
      detections.push({
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        phrase,
        count,
      })
    }
  }
  return detections.sort((a, b) => b.severity * b.count - a.severity * a.count)
}
