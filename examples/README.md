# Examples

Worked examples showing the two layers working together. Run through the
agent with the tools registered by `dsh-humanizer`.

## 1. De-AI humanization (去 AI 味)

**Input (AI-heavy):**

> In today's rapidly evolving landscape, it is important to note that our platform unlocks the potential of seamless collaboration. Furthermore, this revolutionary solution is a game-changer that will elevate your team. In conclusion, we must embrace this paradigm shift.

**`humanize_scan`** → `aiScore` ≈ 40/100, hits: empty opener, clichés, template transitions, summary ending.

**After the agent applies the `humanize_rewrite` brief:**

> We shipped a small tool that lets teams edit together. It's faster than what we had, and a few customers have already switched. We're keeping it simple.

## 2. Voice clone (文风克隆)

First import a profile:

```text
voice_import(name="me-x", samples=[
  "Ship small. Cut the deck talk. One line beats three.",
  "Metrics or it didn't happen. Numbers first, then opinions.",
  "Don't explain. Show the diff."
], platform="x")
```

Then rewrite a draft in that voice:

**Input draft:**

> It is worth noting that our new feature provides a comprehensive set of tools that will help users to streamline their workflow in a seamless manner. Furthermore, we believe this represents a significant step forward.

**`voice_score` (before)** → low (≈ 20/100): long sentences, hedging, AI clichés.

**After the agent applies the `voice_rewrite` brief:**

> New feature is out. Fewer clicks, faster builds. Numbers in the changelog.

**`voice_score` (after)** → high (≈ 85/100): short punchy sentences, no hedging, matched rhythm.
