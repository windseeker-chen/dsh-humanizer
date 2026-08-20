# dsh-humanizer

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) 写作插件。核心命题是——**不是「像人写」，而是「像我写」**：一边去掉通用 AI 腔，一边学习你本人的写作指纹，把任意草稿改成「你写的」。

这是一个给 Agent 用的 **skill**，本身**不依赖 LLM 服务、不做模型调用**：它只负责规则、指纹、打分，以及产出「改写 brief」；真正的改写由 Agent 自己完成。

## 安装

```sh
# 从 GitHub 安装（已内置编译产物 lib/）
dsh plugin add github:lynote-ai/dsh-humanizer

# 或发布到 npm 后：
# dsh plugin add dsh-humanizer
```

配置（可选，都有默认值）：

```yaml
- insert:
    - id: dsh-humanizer
      name: 'dsh-humanizer'
      config:
        strength: standard                          # light | standard | aggressive
        storagePath: ~/.dsh/voice-profiles.json
        maxExcerpts: 3
```

## 工具（8 个，全部确定性、无模型调用）

去 AI 味：

| 工具 | 作用 |
|---|---|
| `humanize_scan` | 检测：AI 分数 + 命中的规则清单 |
| `humanize_rules` | 导出完整规则库（透明、可编辑） |
| `humanize_rewrite` | 产出改写 brief（规则 + 本文命中问题），Agent 按 brief 自己改写 |

个人文风克隆：

| 工具 | 作用 |
|---|---|
| `voice_import` | 导入样本 → 提取文风指纹 → 持久化 Profile |
| `voice_profile` | 查看单个 Profile / 列出全部 |
| `voice_remove` | 删除 Profile |
| `voice_score` | 文本与 Profile 的相似度（0–100 + 分项） |
| `voice_rewrite` | 产出改写 brief（指纹 + 代表样本 few-shot + 本文命中问题） |

## 原理

`src/core/` 是纯函数库，零运行时依赖、可单测：

- `rules.ts` — AI 写作模式规则库（英文 + 中文，参考 stop-slop / Humanizer-zh）
- `analyze.ts` — 去 AI 味扫描：空洞开场、AI 套话、hedge、模板连接词、机械排比、总结式结尾
- `fingerprint.ts` — 文风指纹：句长/节奏 burstiness/标点习惯/人称立场/高频词/词汇丰富度
- `score.ts` — 相似度打分（0–100 + 分项）
- `render.ts` — 改写 brief 构建

`humanize_rewrite` / `voice_rewrite` 不调模型，只返回改写 brief；Agent 拿到 brief 后自己改写。`voice_score` 的分项输出为后续「根据反馈继续学习」留出接口。

## 使用示例（Agent 视角）

```
用户：这是我写的十几条推文，帮我建个「我的文风」。

Agent：
  1. voice_import(name="me-x", samples=[...])   → 提取指纹并保存

用户：把这段 AI 写的发布稿改成我的口吻。

Agent：
  1. voice_score(text=草稿, name="me-x")         → 41/100
  2. voice_rewrite(text=草稿, name="me-x")       → 拿到改写 brief（指纹 + 样本 + 命中问题）
  3. Agent 按 brief 自己改写
  4. voice_score(改写结果, name="me-x")           → 83/100
```

## 开发

```sh
npm install
npm run check       # typecheck + build
npm test            # 单元测试（node --experimental-strip-types）
npm run build       # tsc → lib/
```

## 设计取舍

- **插件不调 LLM**：规则、指纹、打分都是确定性计算，可复现、可单测。
- **单包自包含**：无未发布的共享依赖，`dsh plugin add` 直接可装。
- **持久化用文件而非 `ctx.storage` 后端**：`~/.dsh/*.json`，无 storage 后端也能启动。

## License

[BSD-3-Clause](LICENSE)
