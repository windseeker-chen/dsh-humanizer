# dsh-humanizer

A writing skill for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`). The core idea is **not "write like a human", but "write like me"**: strip generic AI-sounding patterns on one side, learn your own writing fingerprint on the other, and turn any draft into something *you* wrote.

This is a **skill for the agent**, not an LLM wrapper: it performs no model calls. It only produces rules, fingerprints, scores, and rewrite briefs — the agent does the actual rewriting itself.

## Install

```sh
# from GitHub (ships prebuilt lib/)
dsh plugin add github:lynote-ai/dsh-humanizer

# or, once published to npm:
# dsh plugin add dsh-humanizer
```

Optional config (all fields have defaults):

```yaml
- insert:
    - id: dsh-humanizer
      name: 'dsh-humanizer'
      config:
        strength: standard                          # light | standard | aggressive
        storagePath: ~/.dsh/voice-profiles.json
        maxExcerpts: 3
```

## Tools (8 — all deterministic, no model calls)

De-AI:

| Tool | Purpose |
|---|---|
| `humanize_scan` | Detect AI patterns and return an AI-ness score plus the matched rules |
| `humanize_rules` | Export the full rule catalogue (transparent, editable) |
| `humanize_rewrite` | Return a rewrite brief (rules + issues found in this text); the agent applies it |

Personal voice clone:

| Tool | Purpose |
|---|---|
| `voice_import` | Import samples → extract a style fingerprint → persist a profile |
| `voice_profile` | Read one profile, or list all |
| `voice_remove` | Delete a profile |
| `voice_score` | Similarity between text and a profile (0–100 + per-feature breakdown) |
| `voice_rewrite` | Return a rewrite brief (fingerprint + few-shot samples + issues found) |

## How it works

`src/core/` is a pure, dependency-free, unit-tested library:

- `rules.ts` — AI-writing pattern catalogue (English + Chinese, modeled on stop-slop / Humanizer-zh)
- `analyze.ts` — de-AI scan: empty openers, clichés, hedging, template transitions, mechanical parallelism, summary endings
- `fingerprint.ts` — style fingerprint: sentence length / burstiness, punctuation habits, stance (person, adverbs, contractions), preferred vocabulary, lexical richness
- `score.ts` — similarity scoring (0–100 + per-feature breakdown)
- `render.ts` — rewrite-brief construction

`humanize_rewrite` / `voice_rewrite` never call a model — they return a brief, and the agent rewrites in its own turn. `voice_score`'s per-feature output is the hook for future "learn from feedback" iteration.

## Example (agent's point of view)

```
User: I have a dozen tweets I wrote. Build me a "my voice" profile.

Agent:
  1. voice_import(name="me-x", samples=[...])   → extract & store fingerprint

User: Rewrite this AI-written release post in my voice.

Agent:
  1. voice_score(text=draft, name="me-x")        → 41/100
  2. voice_rewrite(text=draft, name="me-x")      → get brief (fingerprint + samples + issues)
  3. agent rewrites following the brief
  4. voice_score(rewritten, name="me-x")         → 83/100
```

## Development

```sh
npm install
npm run check       # typecheck + build
npm test            # unit tests (node --experimental-strip-types)
npm run build       # tsc → lib/
```

## Design decisions

- **No LLM calls** — rules, fingerprints, and scores are deterministic and reproducible.
- **Single self-contained bundle** — no unpublished shared dependency, so `dsh plugin add` just works.
- **File-based persistence** — `~/.dsh/*.json`, no storage backend required.

## License

[BSD-3-Clause](LICENSE)

---

## 中文说明

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）的写作插件。核心理念是——**不是「像人写」，而是「像我写」**：一边去掉通用 AI 腔，一边学习你本人的写作指纹，把任意草稿改成「你写的」。

这是一个给 Agent 用的 **skill**，**不调模型**：只产出规则、指纹、打分和「改写 brief」，真正的改写由 Agent 自己完成。

- **去 AI 味**：`humanize_scan`（检测）/ `humanize_rules`（规则库）/ `humanize_rewrite`（改写 brief）
- **文风克隆**：`voice_import` / `voice_profile` / `voice_remove` / `voice_score`（0–100 相似度）/ `voice_rewrite`（改写 brief）

规则库中英双语覆盖（参考 stop-slop / Humanizer-zh）。指纹提取与打分均为确定性计算，可复现、可单测；Profile 默认持久化到 `~/.dsh/voice-profiles.json`。

安装：`dsh plugin add github:lynote-ai/dsh-humanizer`
